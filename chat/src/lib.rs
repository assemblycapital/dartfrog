use std::{collections::{HashMap, HashSet}, str::FromStr, time::{SystemTime, UNIX_EPOCH}};
use dartfrog_lib::{get_server_address, poke, DartfrogAppInput, DartfrogAppOutput, Service, ServiceAccess, ServiceID, ServiceMetadata};
use kinode_process_lib::{await_message, call_init, get_blob, http::{self, send_ws_push, HttpClientRequest, HttpServerRequest, WsMessageType}, println, Address, LazyLoadBlob};
use serde::{Deserialize, Serialize};
use std::hash::{Hash, Hasher};

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum DartfrogRequest {
    ClientRequest(String, ClientRequest),
    ServiceRequest(String, ServiceRequest),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ServiceRequest {
    Subscribe,
    Unsubscribe,
    Heartbeat,
    AppMessage(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ClientRequest {
    FromFrontend(String),
    FromService(ClientRequestFromService),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum SubscribeNack {
    ServiceDoesNotExist,
    Unauthorized,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum KickReason {
    Custom(String),
    ServiceDeleted,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ClientRequestFromService {
    AppMessage(String),
    Metadata(ServiceMetadata),
    SubscribeAck,
    SubscribeNack(SubscribeNack),
    Kick(KickReason),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum FrontendRequest {
    Meta(FrontendMetaRequest),
    Channel(FrontendChannelRequest),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum FrontendMetaRequest {
    RequestMyServices,
    CreateService(String),
    SetService(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum FrontendChannelRequest {
    Heartbeat,
    MessageClient(String),
    MessageServer(String)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum FrontendUpdate {
    Meta(MetaUpdate),
    Service(String, FrontendServiceUpdate),
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum MetaUpdate {
    MyServices(Vec<String>),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum FrontendServiceUpdate {
    Metadata(ServiceMetadata),
    FromServer(String),
    FromClient(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Consumer {
    pub ws_channel_id: u32,
    pub last_active: u64,
    pub service_id: Option<String>,
}

impl Consumer {
    pub fn new(id:u32) -> Self {
        Consumer {
            ws_channel_id: id,
            last_active: get_now(),
            service_id: None,
        }
    }
}
impl Hash for Consumer{
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.ws_channel_id.hash(state);
    }
}

const CONSUMER_TIMEOUT : u64 = 10*60; //10 minutes

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Client {
    pub id: ServiceID,
    pub meta: Option<ServiceMetadata>,
    pub last_visited: u64,
    pub last_heard_from_host: Option<u64>,
}


#[derive(Debug, Clone)]
pub struct AppState {
    pub consumers: HashMap<u32, Consumer>,
    pub clients: HashMap<String, Client>,
    pub services: HashMap<String, Service>,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            consumers: HashMap::new(),
            clients: HashMap::new(),
            services: HashMap::new()
        }
    }
}

fn get_now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

fn handle_http_server_request(
    our: &Address,
    state: &mut AppState,
    source: &Address,
    body: &[u8],
) -> anyhow::Result<()> {

    let Ok(server_request) = serde_json::from_slice::<HttpServerRequest>(body) else {
        // Fail silently if we can't parse the request
        return Ok(());
    };

    // take the opportunity to kill any old consumers
    // TODO this is weird if the calling consumer times out
    state.consumers.retain(|_, consumer| {
        get_now() - consumer.last_active <= CONSUMER_TIMEOUT
    });

    match server_request {
        HttpServerRequest::WebSocketOpen { channel_id, .. } => {
            state.consumers.insert(channel_id, Consumer::new(channel_id));
        }
        HttpServerRequest::WebSocketPush { channel_id, message_type} => {
            if let Some(consumer) = state.consumers.get_mut(&channel_id) {
                consumer.last_active = get_now();
                if message_type == WsMessageType::Close {
                    state.consumers.remove(&channel_id);
                    return Ok(());
                }
                if message_type != WsMessageType::Binary {
                    return Ok(());
                }
                let Some(blob) = get_blob() else {
                    return Ok(());
                };

                let Ok(_s) = String::from_utf8(blob.bytes.clone()) else {
                    return Ok(());
                };
                match serde_json::from_slice(&blob.bytes)? {
                    FrontendRequest::Meta(m_req) => {
                        println!("meta request: {:?}", m_req);
                        match m_req {
                            FrontendMetaRequest::SetService(sid) => {
                                if let Some(service_id) = ServiceID::from_string(&sid) {
                                    consumer.service_id = Some(sid.clone());
                                    if !state.clients.contains_key(&sid) {
                                        let client = Client {
                                            id: service_id.clone(),
                                            meta: None,
                                            last_visited: get_now(),
                                            last_heard_from_host: None,
                                        };
                                        state.clients.insert(sid.clone(), client);
                                    }
                                    poke(&service_id.address, DartfrogRequest::ServiceRequest(sid, ServiceRequest::Subscribe))?;
                                } else {
                                    // bad service id
                                    // should probably notify frontend of this failure case
                                }
                                
                            }
                            FrontendMetaRequest::RequestMyServices => {
                                let service_keys: Vec<String> = state.services.keys().map(|id| id.to_string()).collect();
                                let response_message = FrontendUpdate::Meta(MetaUpdate::MyServices(service_keys));
                                update_consumer(channel_id, response_message)?;
                            }
                            FrontendMetaRequest::CreateService(name) => {
                                let service = Service::new(&name, our.clone());
                                state.services.insert(service.id.to_string(), service.clone());
                                let req = DartfrogAppOutput::Service(service);
                                poke(&get_server_address(&our.node), req)?;

                            }
                        }
                    }
                    FrontendRequest::Channel(s_req) => {
                        println!("service request: {:?}", s_req);
                        match s_req {
                            FrontendChannelRequest::Heartbeat => {

                            }
                            FrontendChannelRequest::MessageClient(msg) => {

                            }
                            FrontendChannelRequest::MessageServer(msg) => {

                            }
                        }

                    }
                }

            }
        }
        HttpServerRequest::WebSocketClose(channel_id) => {
            state.consumers.remove(&channel_id);
        }
        _ => {
        }
    };

    Ok(())
}

fn update_consumer (
    websocket_id: u32,
    update: FrontendUpdate,
) -> anyhow::Result<()> {

    let blob = LazyLoadBlob {
        mime: Some("application/json".to_string()),
        bytes: serde_json::json!(update)
        .to_string()
        .as_bytes()
        .to_vec(),
    };

    send_ws_push(
        websocket_id,
        WsMessageType::Text,
        blob,
    );
    Ok(())
}

fn handle_df_app_input(our: &Address, state: &mut AppState, source: &Address, app_message: DartfrogAppInput) -> anyhow::Result<()> {
    match app_message {
        DartfrogAppInput::CreateService(service_name) => {
            if source != &get_server_address(&our.node) {
                return Ok(());
            }
            let service = Service::new(&service_name, our.clone());
            state.services.insert(service.id.to_string(), service.clone());

            // notify dartfrog
            let req = DartfrogAppOutput::Service(service);
            poke(&get_server_address(&our.node), req)?;

        }
        DartfrogAppInput::DeleteService(service_id) => {
            if source != &get_server_address(&our.node) {
                return Ok(());
            }
            if let Some(service) = state.services.remove(&service_id) {
                let req = DartfrogAppOutput::DeleteService(service.id);
                poke(&get_server_address(&our.node), req)?;
            } else {
            }
        }
    }
    Ok(())
}

fn poke_client(source: &Address, service_id: String, client_request: ClientRequestFromService) -> anyhow::Result<()> {
    poke(source, DartfrogRequest::ClientRequest(
        service_id,
        ClientRequest::FromService(client_request)
    ))?;
    Ok(())
}

fn handle_df_request(
    our: &Address,
    state: &mut AppState,
    source: &Address,
    request: DartfrogRequest,
) -> anyhow::Result<()> {
    match request {
        DartfrogRequest::ClientRequest(client_id, client_request) => {
            let Some(client) = state.clients.get_mut(&client_id) else {
                println!("Client with id {} does not exist", client_id);
                return Ok(());
            };
            match client_request {
                ClientRequest::FromFrontend(message) => {
                    // Handle the message from the frontend
                    println!("Received message from frontend: {}", message);
                }
                ClientRequest::FromService(message) => {
                    // Handle the message from the service
                    println!("Received message from service: {:?}", message);
                }
            }
        }
        DartfrogRequest::ServiceRequest(service_id, service_request) => {
            let Some(service) = state.services.get_mut(&service_id) else {
                println!("Service with id {} does not exist", service_id);
                match service_request {
                    ServiceRequest::Subscribe => {
                        // poke_client
                        poke_client(source, service_id.clone(), ClientRequestFromService::SubscribeNack(SubscribeNack::ServiceDoesNotExist))?;
                    }
                    _ => {

                    }
                }
                return Ok(());
            };
            match service_request {
                ServiceRequest::Subscribe => {
                    if check_subscribe_permission(service, &source.clone()) {
                        println!("Service {} subscribed", service_id);
                        service.meta.subscribers.insert(source.node.clone());
                        service.meta.user_presence.insert(source.node.clone(), get_now());
                        poke_client(source, service_id.clone(), ClientRequestFromService::SubscribeAck)?;
                        publish_metadata(our, service)?;
                        // TODO notify the service of a new subscription
                    } else {
                        // poke_client
                        poke_client(source, service_id.clone(), ClientRequestFromService::SubscribeNack(SubscribeNack::Unauthorized))?;
                    }
                }
                ServiceRequest::Unsubscribe => {
                    println!("Service {} unsubscribed", service_id);
                    if service.meta.subscribers.contains(&source.node) {
                        service.meta.subscribers.remove(&source.node);
                        service.meta.user_presence.remove(&source.node);
                        publish_metadata(our, service)?;
                        // TODO notify service of unsubscribe
                    }
                }
                ServiceRequest::Heartbeat => {
                    if !service.meta.subscribers.contains(&source.node) {
                        // not subscribed, ignore
                        return Ok(());
                    }
                    service.meta.user_presence.insert(source.node.clone(), get_now());
                    let now = get_now();
                    if let Some(last_sent) = service.meta.last_sent_presence {
                        if (now - last_sent) < 1 * 60 {
                            // "regular metadata updates"
                            // these are evoked by client heartbeats, but only sent up to a capped rate
                            return Ok(());
                        }
                    }

                    // check if anyone needs to be kicked
                    let mut to_kick: HashSet<String> = HashSet::new();
                    for (user, presence_time) in service.meta.user_presence.iter() {
                        const THREE_MINUTES: u64 = 3 * 60;
                        if (now - *presence_time) > THREE_MINUTES {
                            to_kick.insert(user.clone());
                        }
                    }

                    for user in service.meta.subscribers.iter() {
                        if to_kick.contains(user) {
                            let update = ClientRequestFromService::Kick(KickReason::ServiceDeleted);
                            poke_client(source, service_id.clone(), update)?;
                        }
                    }
                    service.meta.subscribers.retain(|x| !to_kick.contains(x));

                    // send metadata update
                    service.meta.last_sent_presence = Some(get_now());
                    publish_metadata(our, service)?;
                }
                ServiceRequest::AppMessage(message) => {
                    println!("Service {} sent message: {}", service_id, message);
                }
            }
        }
    }
    Ok(())
}

fn publish_metadata(our: &Address, service: &Service) -> anyhow::Result<()> {
    // send to dartfrog
    poke(&get_server_address(&our.node), DartfrogAppOutput::Service(service.clone()))?;
    
    // send to all clients
    for client in service.meta.subscribers.iter() {
        let req = DartfrogRequest::ClientRequest(
            service.id.to_string(),
            ClientRequest::FromService(
                ClientRequestFromService::Metadata(service.meta.clone())
            )
        );
        let address = Address {
            node: client.clone(),
            process: our.process.clone(),
        };
        poke(&address, req)?;
    }
    
    Ok(())
}

fn check_subscribe_permission(service: &Service, source: &Address) -> bool {
    if source.process != service.id.address.process {
        return false
    }
    match service.meta.access {
        ServiceAccess::Public => return true,
        ServiceAccess::Whitelist => {
            return service.meta.whitelist.contains(&source.node)
        }
        ServiceAccess::HostOnly => {
            return source.node == service.id.address.node
        }
    }
}

fn handle_message(our: &Address, state: &mut AppState) -> anyhow::Result<()> {
    let message = await_message()?;

    let body = message.body();
    let source = message.source();

    if !message.is_request() {
        return Err(anyhow::anyhow!("unexpected Response: {:?}", message));
    }
    
    if message.source().node == our.node
    && message.source().process == "http_server:distro:sys" {
        let _ = handle_http_server_request(our, state, source, body);
    }
    if let Ok(app_message) = serde_json::from_slice::<DartfrogAppInput>(&body) {
        handle_df_app_input(our, state, source, app_message)?;
    }
    if let Ok(server_client_message) = serde_json::from_slice::<DartfrogRequest>(&body) {
        handle_df_request(our, state, source, server_client_message)?;
    }
    Ok(())
}

call_init!(init);
fn init(our: Address) {
    println!("init chat");
    let mut state: AppState = AppState::new();

    let try_ui = http::secure_serve_ui(&our, "chat-ui", vec!["/"]);
    http::secure_bind_ws_path("/", true).unwrap();

    match try_ui {
        Ok(()) => {}
        Err(e) => {
            println!("chat.wasm error starting ui: {:?}", e)
        }
    };

    loop {
        match handle_message(&our, &mut state) {
            Ok(()) => {}
            Err(e) => {
                println!("chat.wasm error handling message: {:?}", e)
            }
        };
    }
}