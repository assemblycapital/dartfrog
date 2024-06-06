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
struct Service {
    pub id: ServiceId,
    pub metadata: ServiceMetadata,
    pub last_sent_presence: u64,
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
    RequestServiceList,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
enum ServiceRequest {
    Subscribe,
    Unsubscribe,
    PresenceHeartbeat,
    PluginMessageTODO(String)
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
}

#[derive(Debug, Serialize, Deserialize, Clone)]
enum ConsumerClientUpdate {
    Todo(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
enum ConsumerServiceUpdate {
    SubscribeAck,
    // SubscribeAck is potentially obsolete if we always send metadata on subscribe
    ServiceMetadata(ServiceMetadata),
    Kick,
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
    SendOnChannel(ServerRequest),
}

#[derive(Debug, Serialize, Deserialize)]
enum DartMessage {
    ServerRequest(ServerRequest),
    ClientRequest(ClientRequest),
    ClientUpdate(ClientUpdate),
}

fn send_server_updates(state: &DartState, update: ClientUpdate) {
}

fn handle_server_request(our: &Address, state: &mut DartState, source: Address, req: ServerRequest) -> anyhow::Result<()> {
    println!("server request: {:?}", req);
    match req {
        ServerRequest::ServiceRequest(service_id, service_request) => {
            handle_service_request(our, state, source, service_id, service_request)?;

        }
        ServerRequest::CreateService(service_id) => {
            if service_id.node != our.node {
                return Ok(());
            }
            if let Some(service) = state.server.services.get(&service_id.id) {
                // already exists
            } else {
                state.server.services.insert(service_id.id.clone(), new_service(service_id.clone()));
            }
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
                let meta = make_consumer_service_update(service_id, ConsumerServiceUpdate::ServiceMetadata(service.metadata.clone()));
                update_client(ack, source.node.clone())?;
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
    println!("client update: {:?}", upd);
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
    println!("client request: {:?}", req);
    match req {
        ClientRequest::ConsumerRequest(num, inner) => {
            let Some(consumer) = state.client.consumers.get_mut(&num) else {
                println!("no client found");
                return Ok(());
            };
            println!("consumer request: {:?} {:?}", num, inner);
            match inner {
                ConsumerRequest::JoinService(sid) => {
                    if let Some(service) = consumer.services.get(&sid) {
                        // already have it
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
                _ => {
                    println!("unexpected inner client request: {:?}", inner);
                }
            }
        }
        _ => {
        }
    }
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

    match server_request {
        HttpServerRequest::WebSocketOpen { channel_id, .. } => {
            println!("WebSocketOpen: {:?}", channel_id);
            state.client.consumers.insert(
                channel_id,
                Consumer {
                    ws_channel_id: channel_id,
                    services: HashMap::new(),
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
                DartMessage::ClientRequest(c_req) => {
                    match c_req {
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
                    return Err(anyhow::anyhow!("unexpected Request: {:?}", s));
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
                if our.node != SERVER_NODE {
                    // disable user processes acting as servers
                    return Ok(());
                }
                handle_server_request(our, state, source.clone(), s_req)?;
            }
            DartMessage::ClientRequest(c_req) => {
                handle_client_request(our, state, source.clone(), c_req)?;
            }
            DartMessage::ClientUpdate(s_upd) => {
                handle_client_update(our, state, source.clone(), s_upd)?;
            }
            _ => {
                return Err(anyhow::anyhow!("unexpected Request: {:?}", message));
            }
        }
        Ok(())

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
    println!("initializing dartfrog");
    
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