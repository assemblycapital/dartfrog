use std::{collections::HashMap, str::FromStr, time::{SystemTime, UNIX_EPOCH}};
use dartfrog_lib::{get_server_address, poke, DartfrogAppInput, DartfrogAppOutput, Service, ServiceID};
use kinode_process_lib::{await_message, call_init, get_blob, http::{self, send_ws_push, HttpServerRequest, WsMessageType}, println, Address, LazyLoadBlob};
use serde::{Deserialize, Serialize};
use std::hash::{Hash, Hasher};

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum DartfrogRequest {
    Meta(MetaRequest),
    Service(ServiceRequest),
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum MetaRequest {
    RequestMyServices,
    CreateService(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ServiceRequest {
    SetService(ServiceID)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ConsumerUpdate {
    Meta(MetaUpdate),
    Service(String, ServiceUpdate),
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum MetaUpdate {
    MyServices(Vec<String>),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ServiceUpdate {
}


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Consumer {
    pub ws_channel_id: u32,
    pub last_active: u64,
    pub service: Option<String>,
}

impl Consumer {
    pub fn new(id:u32) -> Self {
        Consumer {
            ws_channel_id: id,
            last_active: get_now(),
            service: None,
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
    id: ServiceID,
    todo: u32,
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
                    DartfrogRequest::Meta(m_req) => {
                        println!("meta request: {:?}", m_req);
                        match m_req {
                            MetaRequest::RequestMyServices => {
                            let service_keys: Vec<String> = state.services.keys().map(|id| id.to_string()).collect();
                            let response_message = ConsumerUpdate::Meta(MetaUpdate::MyServices(service_keys));
                            update_consumer(channel_id, response_message)?;


                            }
                            MetaRequest::CreateService(name) => {
                                let service = Service::new(&name, our.clone());
                                state.services.insert(service.id.to_string(), service);

                            }
                        }
                    }
                    DartfrogRequest::Service(s_req) => {
                        println!("service request: {:?}", s_req);
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
    update: ConsumerUpdate,
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
            if source.node != our.node {
                return Ok(());
            }
            // TODO add service settings
            let service = Service::new(&service_name, our.clone());
            state.services.insert(service.id.to_string(), service.clone());

            // notify dartfrog
            let req = DartfrogAppOutput::Service(service);
            poke(&get_server_address(&our.node), req)?;

        }
    }
    Ok(())
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