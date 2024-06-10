use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::str::FromStr;
use std::time::{SystemTime, UNIX_EPOCH};
use std::hash::{Hash, Hasher};

mod constants;
use kinode_process_lib::{http, await_message, call_init, println, Address, Request,
    get_blob, get_typed_state, set_state,
    LazyLoadBlob,
    http::{
        send_response, send_ws_push, HttpServerRequest,
        StatusCode, WsMessageType,
    },
};

wit_bindgen::generate!({
    path: "wit",
    world: "process",
});

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ChatMessage {
    id: u64,
    time: u64,
    from: String,
    msg: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
enum ConnectionStatus {
    Connecting(u64), // time when we started connecting
    Connected(u64), // last time heard
    Disconnected,
}

#[derive(Debug)]
struct DartState {
    pub client: ClientState,
    pub server: ServerState,
}
#[derive(Debug, Serialize, Deserialize, Clone, Hash)]
struct Presence {
    pub time: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ChatState {
    pub last_message_id: u64,
    pub messages: Vec<ChatMessage>,
}
fn new_chat_state() -> ChatState {
    ChatState {
        last_message_id: 0,
        messages: Vec::new(),
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Service {
    pub id: ServiceId,
    pub metadata: ServiceMetadata,
    pub last_sent_presence: u64,
    pub chat_state: ChatState,
}

impl Hash for Service {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.id.hash(state);
    }
}

fn new_service(id: ServiceId) -> Service {
    Service {
        id: id,
        metadata: new_service_metadata(),
        last_sent_presence: 0,
        chat_state: new_chat_state(),
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ServerState {
    pub services: HashMap<String, Service>,
}
fn new_server_state() -> ServerState {
    ServerState {
        services: HashMap::new(),
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ServiceMetadata {
    pub subscribers: HashSet<String>,
    pub user_presence: HashMap<String, Presence>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct SyncService {
    pub id: ServiceId,
    pub metadata: ServiceMetadata,
    pub connection: ConnectionStatus,
}

#[derive(Hash, Debug, Serialize, Deserialize, Clone, Eq, PartialEq)]
struct ConsumerId {
    pub client_node: String,
    pub ws_channel_id: u32,
}

#[derive(Hash, Debug, Serialize, Deserialize, Clone, Eq, PartialEq)]
struct ServiceId {
    pub node: String,
    pub id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Consumer {
    pub ws_channel_id: u32,
    pub services: HashMap<ServiceId, SyncService>,
    pub last_active: u64,
}

impl Hash for Consumer{
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.ws_channel_id.hash(state);
    }
}

#[derive(Debug, Clone)]
struct ClientState {
    pub consumers: HashMap<u32, Consumer>,
}
fn new_client_state() -> ClientState {
    ClientState {
        consumers: HashMap::new(),
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ChannelId {
    pub service_id: ServiceId,
    pub consumer_id: ConsumerId,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
enum ServerRequest {
    ServiceRequest(ServiceId, ServiceRequest),
    CreateService(ServiceId),
    DeleteService(ServiceId),
    RequestServiceList
}

#[derive(Debug, Serialize, Deserialize, Clone)]
enum ChatRequest {
    SendMessage(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
enum ServiceRequest {
    Subscribe,
    Unsubscribe,
    PresenceHeartbeat,
    PluginMessageTODO(String), // plugin id
    ChatRequest(ChatRequest),
}
#[derive(Debug, Serialize, Deserialize, Clone)]
enum ClientUpdate {
    ConsumerUpdate(ConsumerUpdate),
}
#[derive(Debug, Serialize, Deserialize, Clone)]
enum ConsumerUpdate {
    FromClient(ConsumerClientUpdate),
    FromServer(String, ConsumerServerUpdate),
    FromService(String, String, ConsumerServiceUpdate), // service node, service name
}

#[derive(Debug, Serialize, Deserialize, Clone)]
enum ConsumerServerUpdate {
    NoSuchService(String),
    ServiceList(Vec<ServiceId>),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
enum ConsumerClientUpdate {
    Todo(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
enum ConsumerServiceUpdate {
    SubscribeAck,
    ServiceMetadata(ServiceMetadata),
    Kick,
    PluginUpdateTODO,
    ChatUpdate(ChatUpdate),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
enum ChatUpdate {
    Message(ChatMessage),
    FullMessageHistory(Vec<ChatMessage>),
}

#[derive(Debug, Serialize, Deserialize)]
enum ClientRequest{
    ConsumerRequest(u32, ConsumerRequest),
    CreateConsumer(u32),
    DeleteConsumer(u32),
}

#[derive(Debug, Serialize, Deserialize)]
enum ConsumerRequest {
    RequestServiceList(String),
    JoinService(ServiceId),
    ExitService(ServiceId),
    ServiceHeartbeat(ServiceId),
    SendToService(ServiceId, ChatRequest),
}

#[derive(Debug, Serialize, Deserialize)]
enum DartMessage {
    ServerRequest(ServerRequest),
    ClientRequest(ClientRequest),
    ClientUpdate(ClientUpdate),
}
fn handle_server_request(our: &Address, state: &mut DartState, source: Address, req: ServerRequest) -> anyhow::Result<()> {
    // println!("server request: {:?}", req);
    match req {
        ServerRequest::ServiceRequest(service_id, service_request) => {
            handle_service_request(our, state, source, service_id, service_request)?;
        }
        ServerRequest::CreateService(service_id) => {
            if source.node != our.node {
                return Ok(());
            }
            if service_id.node != our.node {
                return Ok(());
            }
            if let Some(service) = state.server.services.get(&service_id.id) {
                // already exists
            } else {
                state.server.services.insert(service_id.id.clone(), new_service(service_id.clone()));
            }
        }
        ServerRequest::DeleteService(service_id) => {
            if source.node != our.node {
                return Ok(());
            }
            if let Some(service) = state.server.services.get(&service_id.id) {
                for subscriber in service.metadata.subscribers.clone() {
                    let update = ConsumerUpdate::FromService(service_id.node.clone(), service_id.id.clone(), ConsumerServiceUpdate::Kick);
                    update_client(update, subscriber)?;
                }
                state.server.services.remove(&service_id.id.clone());
            }

        }
        ServerRequest::RequestServiceList => {
            let services: Vec<ServiceId> = state.server.services.keys().map(|x| ServiceId {
                node: our.node.clone(),
                id: x.clone()
            }).collect();
            let update = ConsumerUpdate::FromServer(our.node.clone(), ConsumerServerUpdate::ServiceList(services));
            update_client(update, source.node.clone())?;
        }
        _ => {

        }
    }
    Ok(())
}

fn make_consumer_service_update(service_id: ServiceId, update: ConsumerServiceUpdate) -> ConsumerUpdate {
    ConsumerUpdate::FromService(service_id.node.clone(), service_id.id.clone(), update)
}

fn handle_service_request(our: &Address, state: &mut DartState, source: Address, service_id: ServiceId, req: ServiceRequest) -> anyhow::Result<()> {
    if service_id.node != our.node {
        return Ok(());
    }
    if let Some(service) = state.server.services.get_mut(&service_id.id) {
        // handle the request
        match req {
            ServiceRequest::ChatRequest(req) => {
                match req {
                    ChatRequest::SendMessage(msg) => {
                        
                        let chat_msg = ChatMessage {
                            id: service.chat_state.last_message_id,
                            time: SystemTime::now()
                                .duration_since(UNIX_EPOCH)
                                .unwrap()
                                .as_secs(),
                            from: source.node.clone(),
                            msg: msg,
                        };

                        service.chat_state.messages.push(chat_msg.clone());

                        // If the messages list is longer than 64, retain only the last 64 messages
                        if service.chat_state.messages.len() > 64 {
                            service.chat_state.messages = service.chat_state.messages.split_off(service.chat_state.messages.len() - 64);
                        }

                        service.chat_state.last_message_id += 1;
                        let update = make_consumer_service_update(service_id.clone(),  ConsumerServiceUpdate::ChatUpdate(ChatUpdate::Message(chat_msg)));
                        update_subscribers(update, service.metadata.subscribers.clone())?;
                    }
                }
            }
            ServiceRequest::Subscribe => {
                if !service.metadata.subscribers.contains(&source.node.clone()) {
                    // already subscribed, continue anyways
                }
                service.metadata.subscribers.insert(source.node.clone());
                service.metadata.user_presence.insert(source.node.clone(), Presence {
                    time: SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs(),
                });
                let ack = make_consumer_service_update(service_id.clone(), ConsumerServiceUpdate::SubscribeAck);
                let meta = make_consumer_service_update(service_id.clone(), ConsumerServiceUpdate::ServiceMetadata(service.metadata.clone()));
                let chat = make_consumer_service_update(service_id, ConsumerServiceUpdate::ChatUpdate(ChatUpdate::FullMessageHistory(service.chat_state.messages.clone())));
                update_client(ack, source.node.clone())?;
                update_client(chat, source.node.clone())?;
                update_subscribers(meta, service.metadata.subscribers.clone())?;
            }
            ServiceRequest::Unsubscribe => {
                if !service.metadata.subscribers.contains(&source.node.clone()) {
                    // already unsubscribed, ignore
                    return Ok(());
                }
                service.metadata.subscribers.remove(&source.node.clone());
                let meta = make_consumer_service_update(service_id, ConsumerServiceUpdate::ServiceMetadata(service.metadata.clone()));
                update_subscribers(meta, service.metadata.subscribers.clone())?;
            }
            ServiceRequest::PresenceHeartbeat => {
                if !service.metadata.subscribers.contains(&source.node.clone()) {
                    // not subscribed, ignore
                    return Ok(());
                }
                service.metadata.user_presence.insert(source.node.clone(), Presence {
                    time: SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs(),
                });
                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
                if (now - service.last_sent_presence) < 1*60 {
                    // "regular metadata updates"
                    // these are evoked by client heartbeats, but only sent up to a capped rate
                    return Ok(());
                }
                // 
                // check if anyone needs to be kicked
                // 
                let mut to_kick: HashSet<String> = HashSet::new();
                for (user, presence) in service.metadata.user_presence.iter() {
                    const THREE_MINUTES : u64 = 3*60;
                    if (now - presence.time) > THREE_MINUTES {
                        to_kick.insert(user.clone());
                    }
                }

                for (user) in service.metadata.subscribers.iter() {
                    if to_kick.contains(user) {
                        let update: ConsumerUpdate = ConsumerUpdate::FromService(service_id.node.clone(), service_id.id.clone(), ConsumerServiceUpdate::Kick);
                        update_client(update, user.clone())?;
                    }
                }
                service.metadata.subscribers.retain(|x| !to_kick.contains(x));

                // send metadata update
                service.last_sent_presence = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
                let meta = make_consumer_service_update(service_id, ConsumerServiceUpdate::ServiceMetadata(service.metadata.clone()));
                update_subscribers(meta, service.metadata.subscribers.clone())?;
            }
            _ => {
                println!("unexpected service request: {:?}", req);
            }
        }
    } else {
        // respond with NoSuchService
        let update = ConsumerUpdate::FromServer(our.node().to_string(), ConsumerServerUpdate::NoSuchService(service_id.id.clone()));
        update_client(update, source.node.clone())?;
    }
    Ok(())
}

fn update_subscribers(update: ConsumerUpdate, subscribers: HashSet<String>) -> anyhow::Result<()> {
    for subscriber in subscribers {
        update_client(update.clone(), subscriber)?;
    }
    Ok(())
}

fn handle_client_update(our: &Address, state: &mut DartState, source: Address, upd: ClientUpdate) -> anyhow::Result<()> {
    // println!("client update: {:?}", upd);
    match upd {
        ClientUpdate::ConsumerUpdate(consumer_update) => {
            // possibly intercept the update first
            // TODO filter out lying updates
            // e.g. an update could lie about its source address if not checked
            match consumer_update.clone() {
                ConsumerUpdate::FromServer(server_node, inner) => {
                    // handle the request
                    if server_node != source.node {
                        // no spoofing
                        return Ok(());
                    }
                    update_all_consumers(&state, consumer_update.clone());
                    
                }
                ConsumerUpdate::FromService(service_node, service_name, inner) => {
                    // handle the request

                    if service_node != source.node {
                        // no spoofing
                        return Ok(());
                    }

                    let service_id: ServiceId = ServiceId {
                        node: service_node.clone(),
                        id: service_name.clone()
                    };
                    for (consumer_id, consumer) in state.client.consumers.iter_mut() {
                        if (!consumer.services.contains_key(&service_id)) {
                            continue;
                        }
                        let service = consumer.services.get_mut(&service_id).unwrap();
                        match inner {
                            ConsumerServiceUpdate::Kick => {
                                consumer.services.remove(&service_id);
                                update_consumer(consumer.ws_channel_id, consumer_update.clone())?;
                            }
                            ConsumerServiceUpdate::ServiceMetadata(ref metadata) => {
                                let service = consumer.services.get_mut(&service_id).unwrap();
                                service.metadata = metadata.clone();
                                service.connection = ConnectionStatus::Connected(
                                    SystemTime::now()
                                        .duration_since(UNIX_EPOCH)
                                        .unwrap()
                                        .as_secs(),
                                );
                                update_consumer(consumer.ws_channel_id, consumer_update.clone())?;
                            }
                            ConsumerServiceUpdate::ChatUpdate(ref _upd) => {
                                update_consumer(consumer.ws_channel_id, consumer_update.clone())?;
                            }
                            _ => {
                            }
                        }
                    }
                }
                _ => {
                }
            }
        }
        _ => {

        }
    }
    Ok(())
}

fn new_service_metadata() -> ServiceMetadata {
    ServiceMetadata {
        subscribers: HashSet::new(),
        user_presence: HashMap::new(),
    }
}
fn new_sync_service(id: ServiceId) -> SyncService {
    SyncService {
        id: id,
        metadata: new_service_metadata(),
        connection: ConnectionStatus::Connecting(
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        ),
    }
}

fn get_client_id(our: &Address, consumer: &Consumer) -> ConsumerId {
    ConsumerId {
        client_node: our.node.clone(),
        ws_channel_id: consumer.ws_channel_id,
    }
}

fn handle_client_request(our: &Address, state: &mut DartState, source: Address, req: ClientRequest) -> anyhow::Result<()> {
    // println!("client request: {:?}", req);
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    match req {
        ClientRequest::DeleteConsumer(num) => {

            let mut all_services: HashMap<ServiceId, HashSet<u32>> = HashMap::new();
            for (id, consumer) in state.client.consumers.iter() {
                for (service_id, _service) in consumer.services.iter() {
                    all_services
                        .entry(service_id.clone())
                        .or_insert_with(HashSet::new)
                        .insert(id.clone());
                }
            }
            if let Some(consumer) = state.client.consumers.get(&num) {
                for (service_id, service) in consumer.services.iter() {
                    // TODO this kind of sucks
                    // here we only send the unsub if no other consumer is subscribed to the service in question
                    // 
                    // in the future, consumers should just unsubscribe onclose,
                    //  it just requires extending some consumer scope to the service
                    //  but that adds some complexity, and could be inefficient if not done correctly
                    // 
                    let consumers_with_this_service = all_services.get(&service_id).unwrap();
                    if consumers_with_this_service.len() == 1 {
                        let s_req = ServerRequest::ServiceRequest(service_id.clone(), ServiceRequest::Unsubscribe);
                        let address = get_server_address(service_id.node.as_str());
                        poke_server(&address, s_req)?;
                    }
                }
                // println!("deleting consumer");
                state.client.consumers.remove(&num);
            }
        }
        ClientRequest::ConsumerRequest(num, inner) => {
            let Some(consumer) = state.client.consumers.get_mut(&num) else {
                // println!("no consumer found {:?} {:?}", num, inner);
                return Ok(());
            };
            // println!("consumer request: {:?} {:?}", num, inner);
            consumer.last_active = now;

            match inner {
                ConsumerRequest::JoinService(sid) => {
                    if let Some(service) = consumer.services.get(&sid) {
                        // already have it
                        // send this anyways just to refresh the connection
                        let s_req = ServerRequest::ServiceRequest(sid.clone(), ServiceRequest::Subscribe);
                        let address = get_server_address(sid.clone().node.as_str());
                        poke_server(&address, s_req)?;
                    } else {
                        consumer.services.insert(sid.clone(), new_sync_service(sid.clone()));

                        let consumer_id = get_client_id(our, consumer);
                        let s_req = ServerRequest::ServiceRequest(sid.clone(), ServiceRequest::Subscribe);
                        let address = get_server_address(sid.clone().node.as_str());
                        poke_server(&address, s_req)?;
                        let update = ConsumerUpdate::FromClient(ConsumerClientUpdate::Todo("clientmodule created your service, poking server".to_string()));
                        update_consumer(num, update)?;
                    }
                }
                ConsumerRequest::ExitService(sid) => {
                    if let Some(service) = consumer.services.get(&sid) {
                        let s_req = ServerRequest::ServiceRequest(sid.clone(), ServiceRequest::Unsubscribe);
                        let address = get_server_address(sid.clone().node.as_str());
                        poke_server(&address, s_req)?;
                        consumer.services.remove(&sid);

                    } else {
                        // already have it
                        // TODO maybe tell frontend that it's already gone
                    }
                }
                ConsumerRequest::ServiceHeartbeat(sid) => {
                    if let Some(service) = consumer.services.get(&sid) {
                        let s_req = ServerRequest::ServiceRequest(sid.clone(), ServiceRequest::PresenceHeartbeat);
                        let address = get_server_address(sid.clone().node.as_str());
                        poke_server(&address, s_req)?;
                    } else {
                        // dont have this service
                        // TODO maybe tell frontend that it's missing
                    }
                }
                ConsumerRequest::RequestServiceList(server_node) => {
                    let s_req = ServerRequest::RequestServiceList;
                    let address = get_server_address(server_node.as_str());
                    poke_server(&address, s_req)?;
                }
                ConsumerRequest::SendToService(sid, req ) => {
                    if let Some(service) = consumer.services.get(&sid) {
                        let s_req = ServerRequest::ServiceRequest(sid.clone(), ServiceRequest::ChatRequest(req));
                        let address = get_server_address(sid.clone().node.as_str());
                        poke_server(&address, s_req)?;
                    } else {
                        // dont have this service
                        // TODO maybe tell frontend that it's missing
                    }
                }
                _ => {
                    println!("unexpected consumer request: {:?}", inner);
                }
            }
        }
        _ => {
        }
    }
    // clean up inactive consumers
    let mut to_kick: HashSet<u32> = HashSet::new();
    // iterate over consumers and remove inactive
    for (id, consumer) in state.client.consumers.iter() {
        const FOUR_MINUTES : u64 = 4*60;
        if (now - consumer.last_active) > FOUR_MINUTES {
            to_kick.insert(id.clone());
        }
    }
    state.client.consumers.retain(|x, _| !to_kick.contains(x));

    // TODO possibly update / kick consumer frontend
    // not important rn because they are most likely already disconnected

    Ok(())
}

fn handle_http_server_request(
    our: &Address,
    state: &mut DartState,
    source: &Address,
    body: &[u8],
) -> anyhow::Result<()> {

    let Ok(server_request) = serde_json::from_slice::<HttpServerRequest>(body) else {
        // Fail silently if we can't parse the request
        return Ok(());
    };

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    match server_request {
        HttpServerRequest::WebSocketOpen { channel_id, .. } => {
            // println!("WebSocketOpen: {:?}", channel_id);
            state.client.consumers.insert(
                channel_id,
                Consumer {
                    ws_channel_id: channel_id,
                    services: HashMap::new(),
                    last_active: now,
                },
            );
        }
        HttpServerRequest::WebSocketPush { channel_id, message_type : _} => {
            let Some(blob) = get_blob() else {
                return Ok(());
            };

            let Ok(s) = String::from_utf8(blob.bytes.clone()) else {
                println!("error parsing utf8 ws push");
                return Ok(());
            };

            match serde_json::from_slice(&blob.bytes)? {
                DartMessage::ServerRequest(s_req) => {
                    handle_server_request(our, state, source.clone(), s_req)?;
                }
                DartMessage::ClientRequest(c_req) => {
                    match c_req {
                        ClientRequest::DeleteConsumer(_num) => {
                            // write down the current channel_id, num inaccurate from the api lib
                            let req = ClientRequest::DeleteConsumer(channel_id);
                            handle_client_request(our, state, source.clone(), req)?;
                        }
                        ClientRequest::ConsumerRequest(_num, inner) => {
                            // write down the current channel_id, num inaccurate from the api lib
                            let req = ClientRequest::ConsumerRequest(channel_id, inner);
                            handle_client_request(our, state, source.clone(), req)?;
                        }
                        _ => {
                            println!("unexpected client request: {:?}", c_req);
                        }
                    }
                }
                _ => {
                    println!("unexpected Request: {:?}", s)
                    // return Err(anyhow::anyhow!("unexpected Request: {:?}", s));
                }
            }
        }
        HttpServerRequest::WebSocketClose(channel_id) => {
            state.client.consumers.remove(&channel_id);
        }
        HttpServerRequest::Http(request) => {
        }
    };

    Ok(())
}

fn handle_message(our: &Address, state: &mut DartState) -> anyhow::Result<()> {
    let message = await_message()?;

    let body = message.body();
    let source = message.source();
    if !message.is_request() {
        return Err(anyhow::anyhow!("unexpected Response: {:?}", message));
    }
    if message.source().node == our.node
        && message.source().process == "http_server:distro:sys" {
        handle_http_server_request(our, state, source, body)
    } else {

        match serde_json::from_slice(body)? {
            DartMessage::ServerRequest(s_req) => {
                handle_server_request(our, state, source.clone(), s_req)?;
            }
            DartMessage::ClientRequest(c_req) => {
                if our.node != source.node {
                    // we only send client requests to ourself
                    return Ok(());
                }
                handle_client_request(our, state, source.clone(), c_req)?;
            }
            DartMessage::ClientUpdate(s_upd) => {
                handle_client_update(our, state, source.clone(), s_upd)?;
            }
            _ => {
                println!("unexpected Request: {:?}", message);
                // return Err(anyhow::anyhow!("unexpected Request: {:?}", message));
            }
        }
        Ok(())

    }

}

fn update_all_consumers (state: &DartState, update: ConsumerUpdate) {
    for (id, consumer) in state.client.consumers.iter() {
        update_consumer(consumer.ws_channel_id, update.clone()).unwrap();
    }
}

fn update_consumer (
    // state: &DartState,
    websocket_id: u32,
    update: ConsumerUpdate,
) -> anyhow::Result<()> {

    // if !(state.client.consumers.contains_key(&websocket_id)) {
    //     return Ok(());
    // }

    let blob = LazyLoadBlob {
        mime: Some("application/json".to_string()),
        bytes: serde_json::json!(update)
        .to_string()
        .as_bytes()
        .to_vec(),
    };

    // Send a WebSocket message to the http server in order to update the UI
    send_ws_push(
        websocket_id,
        WsMessageType::Text,
        blob,
    );
    Ok(())
}

const IS_FAKE: bool = !cfg!(feature = "prod");
const SERVER_NODE: &str = if IS_FAKE { "fake.dev" } else { "waterhouse.os" };
const PROCESS_NAME : &str = "dartfrog:dartfrog:herobrine.os";

fn get_server_address(node_id: &str) -> Address {
    let s =
        format!("{}@{}", node_id, PROCESS_NAME);
    Address::from_str(&s).unwrap()
}


fn new_dart_state() -> DartState {
    DartState {
        client: new_client_state(),
        server: new_server_state()
    }
}

call_init!(init);
fn init(our: Address) {
    println!("initializing");
    
    // Serve the index.html and other UI files found in pkg/ui at the root path.
    http::serve_ui(&our, "ui", true, false, vec!["/"]).unwrap();

    // Allow HTTP requests to be made to /api; they will be handled dynamically.
    http::bind_http_path("/api", true, false).unwrap();

    // Allow websockets to be opened at / (our process ID will be prepended).
    http::bind_ws_path("/", true, false).unwrap();

    Request::to(("our", "homepage", "homepage", "sys"))
        .body(
            serde_json::json!({
                "Add": {
                    "label": "dartfrog",
                    "icon": constants::HOMEPAGE_IMAGE,
                    "path": "/",
                    // "widget": get_widget(),
                }
            })
            .to_string()
            .as_bytes()
            .to_vec(),
        )
        .send()
        .unwrap();

    // let server = get_server_address(SERVER_NODE);
    poke_server(&our, ServerRequest::CreateService(ServiceId {
        node: our.node.clone(),
        id: "chat".to_string()
    })).unwrap();

    let mut state = new_dart_state();
    // state.server.chat_state = load_chat_state();

    // subscribe to SERVER
    // let _ = subscribe_to_server(&mut state, &server);

    loop {
        match handle_message(&our, &mut state) {
            Ok(()) => {}
            Err(e) => {
                println!("handle_message error: {:?}", e);
            }
        };
    }
}

fn update_client(update: ConsumerUpdate, client_node: String) -> anyhow::Result<()> {
    let address = get_server_address(&client_node);
    Request::to(address)
        .body(serde_json::to_vec(&DartMessage::ClientUpdate(ClientUpdate::ConsumerUpdate(update)))?)
        .send()?;
    Ok(())
}

fn poke_server(address:&Address, req: ServerRequest) -> anyhow::Result<()> {
    Request::to(address)
        .body(serde_json::to_vec(&DartMessage::ServerRequest(req))?)
        .send()?;
    Ok(())
}