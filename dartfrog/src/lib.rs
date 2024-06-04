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

#[derive(Debug, Serialize, Deserialize)]
enum WsUpdate{
    Todo(String)
}

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
    pub was_online_at_time: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Service {
    pub id: ServiceId,
    pub subscribers: HashSet<ClientId>,
    pub last_sent_presence: u64,
    pub user_presence: HashMap<String, Presence>,
}

impl Hash for Service {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.id.hash(state);
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ServerState {
    pub services: HashMap<String, Service>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct SyncService {
    pub id: ServiceId,
    pub subscribers: HashSet<ClientId>,
    pub user_presence: HashMap<String, Presence>,
    pub connection: ConnectionStatus,
}

#[derive(Hash, Debug, Serialize, Deserialize, Clone, Eq, PartialEq)]
struct ClientId {
    pub client_node: String,
    pub client_name: String,
}

#[derive(Hash, Debug, Serialize, Deserialize, Clone, Eq, PartialEq)]
struct ServiceId {
    pub node: String,
    pub id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Client {
    pub client_name: String,
    pub services: HashMap<ServiceId, SyncService>,
}

impl Hash for Client {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.client_name.hash(state);
    }
}

#[derive(Debug, Clone)]
struct ClientState {
    pub clients: HashMap<String, Client>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ChannelId {
    pub service_id: ServiceId,
    pub client_id: ClientId,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
enum ServerRequest {
    Subscribe(ChannelId),
    Unsubscribe(ChannelId),
    PresenceHeartbeat(ChannelId),
}
#[derive(Debug, Serialize, Deserialize)]
enum UpdateFromServer {
    SubscribeAck(ChannelId),
    SubscribeNack(ChannelId),
    SubscribeKick(ChannelId),
}
#[derive(Debug, Serialize, Deserialize)]
enum ClientRequest {
    Subscribe(ChannelId),
    Unsubscribe(ChannelId),
    PresenceHeartbeat(ChannelId),
}

#[derive(Debug, Serialize, Deserialize)]
enum DartMessage {
    ServerRequest(ServerRequest),
    ClientRequest(ClientRequest),
    UpdateFromServer(UpdateFromServer),
}

fn send_server_updates(state: &DartState, update: UpdateFromServer) {
}

fn handle_server_request(our: &Address, state: &mut DartState, source: Address, req: ServerRequest) -> anyhow::Result<()> {
    Ok(())
}

fn handle_server_update(our: &Address, state: &mut DartState, source: Address, req: UpdateFromServer) -> anyhow::Result<()> {
    Ok(())
}

fn safe_trim_to_boundary(s: String, max_len: usize) -> String {
    if s.len() <= max_len {
        return s;
    }

    let mut end = max_len;
    while !s.is_char_boundary(end) {
        end -= 1;
    }

    s[..end].to_string()
}

fn handle_client_request(our: &Address, state: &mut DartState, source: Address, req: ClientRequest) -> anyhow::Result<()> {
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
        }
        HttpServerRequest::WebSocketPush { .. } => {
        }
        HttpServerRequest::WebSocketClose(channel_id) => {
        }
        HttpServerRequest::Http(request) => {
            let request_type = request.method()?;
            let request_type_str = request_type.as_str();
            if request_type_str != "POST" {
                return Ok(());
            }

            let Some(blob) = get_blob() else {
                return Ok(());
            };
            let Ok(s) = String::from_utf8(blob.bytes) else {
                return Ok(());
            };
            match serde_json::from_str(&s)? {
                DartMessage::ClientRequest(c_req) => {
                    let mut headers = HashMap::new();
                    headers.insert("Content-Type".to_string(), "application/json".to_string());
                    send_response(
                        StatusCode::OK,
                        Some(headers),
                        serde_json::to_vec(b"")
                        .unwrap(),
                    );

                    let send_body : Vec<u8> = serde_json::to_vec(&DartMessage::ClientRequest(c_req)).unwrap();
                    Request::new()
                        .target(our)
                        .body(send_body)
                        .send()
                        .unwrap();
                }
                // couldn't parse json
                _ => { }
            }
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
            DartMessage::UpdateFromServer(s_upd) => {
                handle_server_update(our, state, source.clone(), s_upd)?;
            }
            _ => {
                return Err(anyhow::anyhow!("unexpected Request: {:?}", message));
            }
        }
        Ok(())

    }

}
fn send_ws_update(
    update: WsUpdate,
    open_channels: &HashSet<u32>,
) -> anyhow::Result<()> {

    for channel in open_channels {
        // Generate a blob for the new message
        let blob = LazyLoadBlob {
            mime: Some("application/json".to_string()),
            bytes: serde_json::json!({
                "WsUpdate": update
            })
            .to_string()
            .as_bytes()
            .to_vec(),
        };

        // Send a WebSocket message to the http server in order to update the UI
        send_ws_push(
            *channel,
            WsMessageType::Text,
            blob,
        );
    }
    Ok(())
}

const IS_FAKE: bool = !cfg!(feature = "prod");
const SERVER_NODE: &str = if IS_FAKE { "fake.dev" } else { "waterhouse.os" };
const PROCESS_NAME : &str = "dartfrog:dartfrog:herobrine.os";
fn get_server_address(node_id: &str) -> String {
    format!("{}@{}", node_id, PROCESS_NAME)
}

fn new_client_state() -> ClientState {
    ClientState {
        clients: todo!(),
    }
}

fn new_server_state() -> ServerState {
    ServerState {
        services: todo!(),
    }
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

    let server = Address::from_str(&get_server_address(SERVER_NODE)).unwrap();
    let mut state = new_dart_state();
    // state.server.chat_state = load_chat_state();

    // subscribe to SERVER
    // let _ = subscribe_to_server(&mut state, &server);

    loop {
        match handle_message(&our, &mut state) {
            Ok(()) => {}
            Err(e) => {
                println!("error: {:?}", e);
            }
        };
    }
}


fn poke_server(state: &DartState, req: ServerRequest) -> anyhow::Result<()> {
    Ok(())
}