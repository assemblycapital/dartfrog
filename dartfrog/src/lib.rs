use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::str::FromStr;
use std::time::{SystemTime, UNIX_EPOCH};

mod constants;
use kinode_process_lib::{http, await_message, call_init, println, Address, Request,
    get_blob,
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
enum WsDartUpdate{
    // TODO maybe we can just use the UpdateFromServer struct
    NewChat(ChatMessage),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ChatMessage {
    time: u64,
    from: String,
    msg: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
enum ConnectionStatus {
    Connecting(u64), // time when we started connecting
    Connected(u64), // last time heard
}

#[derive(Debug, Serialize, Deserialize)]
struct DartState {
    pub client: ClientState,
    pub server: ServerState,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ChatState {
    pub chat_history: Vec<ChatMessage>,
    pub user_presence: HashMap<String, u64>, // user presence, map from name to last time seen
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ServerState {
    pub chat_state: ChatState,
    pub subscribers: HashSet<Address>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct SyncServerState {
    pub address: Address,
    pub connection: ConnectionStatus,
    pub chat_state: ChatState,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ClientState {
    pub server: Option<SyncServerState>,
    pub ws_channels: HashSet<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
enum ServerRequest {
    ChatMessage(String),
    Subscribe,
    Unsubscribe,
    PresenceHeartbeat,
    RequestChatState,
}
#[derive(Debug, Serialize, Deserialize)]
enum UpdateFromServer {
    ChatMessage(ChatMessage),
    ChatState(ChatState),
}
#[derive(Debug, Serialize, Deserialize)]
enum ClientRequest {
    SendToServer(ServerRequest),
    SetServer(Option<Address>),
}

#[derive(Debug, Serialize, Deserialize)]
enum DartMessage {
    ServerRequest(ServerRequest),
    ClientRequest(ClientRequest),
    UpdateFromServer(UpdateFromServer),
}

fn handle_server_request(our: &Address, state: &mut DartState, source: Address, req: ServerRequest) -> anyhow::Result<()> {
    println!("server request: {:?}", req);
    let now = {
        let start = SystemTime::now();
        start.duration_since(UNIX_EPOCH).unwrap().as_secs() 
    };
    match req {
        ServerRequest::PresenceHeartbeat => {
            state.server.chat_state.user_presence.insert(source.node.clone(), now);
        }
        ServerRequest::ChatMessage(msg) => {
            let chat_msg = ChatMessage {
                time: now,
                from: source.node.clone(),
                msg: msg.clone(),
            };
            state.server.chat_state.chat_history.push(chat_msg.clone());
            for sub in state.server.subscribers.iter() {

                let send_body : Vec<u8> = serde_json::to_vec(&DartMessage::UpdateFromServer(UpdateFromServer::ChatMessage(chat_msg.clone()))).unwrap();
                Request::new()
                    .target(sub)
                    .body(send_body)
                    .send()
                    .unwrap();
            }
            state.server.chat_state.user_presence.insert(source.node.clone(), now);
        }
        ServerRequest::RequestChatState => {
            let send_body : Vec<u8> = serde_json::to_vec(&DartMessage::UpdateFromServer(UpdateFromServer::ChatState(state.server.chat_state.clone()))).unwrap();
            Request::new()
                .target(source)
                .body(send_body)
                .send()
                .unwrap();

        }
        ServerRequest::Subscribe => {
            state.server.subscribers.insert(source.clone());
            state.server.chat_state.user_presence.insert(source.node.clone(), now);
        }
        ServerRequest::Unsubscribe => {
            state.server.subscribers.remove(&source);
            state.server.chat_state.user_presence.insert(source.node.clone(), now);
        }
    }
    Ok(())
}

fn handle_server_update(our: &Address, state: &mut DartState, source: Address, req: UpdateFromServer) -> anyhow::Result<()> {
    println!("client request: {:?}", req);
    match req {
        UpdateFromServer::ChatMessage(chat)=> {
            if let Some(server) = &state.client.server {
                if source == server.address {
                    send_ws_update(our, WsDartUpdate::NewChat(chat), &state.client.ws_channels).unwrap();
                }
            }
        }
        UpdateFromServer::ChatState(chat_state)=> {
            // TODO
            println!("got chat state update");
        }
    }
    Ok(())
}

fn handle_client_request(our: &Address, state: &mut DartState, source: Address, req: ClientRequest) -> anyhow::Result<()> {
    println!("client request: {:?}", req);
    match req {
        ClientRequest::SendToServer(freq) => {
            if source.node != *our.node {
                return Err(anyhow::anyhow!("invalid source: {:?}", source));
            }
            if let Some(server) = &state.client.server {
                let send_body : Vec<u8> = serde_json::to_vec(&DartMessage::ServerRequest(freq)).unwrap();
                Request::new()
                    .target(server.address.clone())
                    .body(send_body)
                    .send()
                    .unwrap();

            }
        }
        ClientRequest::SetServer(mad) => {
            if let Some(add) = mad {
                // disconnecting
                // send unsubscribe
            } else {

            }
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
    // println!("http server request {:?}", server_request);

    match server_request {
        HttpServerRequest::WebSocketOpen { channel_id, .. } => {
            // println!("channel opened: {:?}", channel_id);
            state.client.ws_channels.insert(channel_id);
        }
        HttpServerRequest::WebSocketPush { .. } => {
            let Some(blob) = get_blob() else {
                return Ok(());
            };
        }
        HttpServerRequest::WebSocketClose(channel_id) => {
            state.client.ws_channels.remove(&channel_id);
        }
        HttpServerRequest::Http(request) => {
            //
            // TODO check url /api
            let request_type = request.method()?;
            let request_type_str = request_type.as_str();
            if request_type_str != "POST" {
                return Ok(());
            }
            // Get all messages
            let Some(blob) = get_blob() else {
                return Ok(());
            };
            // let Ok(client_request) = serde_json::from_slice::<ClientRequest>(body) else {
            let Ok(s) = String::from_utf8(blob.bytes) else {
                return Ok(());
            };
            match serde_json::from_str(&s)? {
                DartMessage::ClientRequest(c_req) => {
                    println!("http client request: {:?}", c_req);

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
                // couldn't parse PUT json
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
    our: &Address,
    update: WsDartUpdate,
    open_channels: &HashSet<u32>,
) -> anyhow::Result<()> {

    for channel in open_channels {
          // Generate a blob for the new message
          let blob = LazyLoadBlob {
            mime: Some("application/json".to_string()),
            bytes: serde_json::json!({
                "WsDartUpdate": update
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

const SERVER : &str = "fake.dev";
const PROCESS_ID : &str = "dartfrog:dartfrog:template.os";
fn get_server_address(node_id: &str) -> String {
    format!("{}@{}", node_id, PROCESS_ID)
}
call_init!(init);
fn init(our: Address) {
    
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
                }
            })
            .to_string()
            .as_bytes()
            .to_vec(),
        )
        .send()
        .unwrap();



    let server = Address::from_str(&get_server_address(SERVER)).unwrap();
    let mut state = DartState {
        client: ClientState {
            server: None,
            ws_channels: HashSet::new(),
        },
        server: ServerState {
            chat_state: ChatState {
                chat_history: Vec::new(),
                user_presence: HashMap::new(),
            },
            subscribers: HashSet::new(),
        },
    };

    println!("hello dartfrog");
    // subscribe to SERVER
    let _ = subscribe_to_server(&mut state, &server);

    loop {
        match handle_message(&our, &mut state) {
            Ok(()) => {}
            Err(e) => {
                println!("error: {:?}", e);
            }
        };
    }
}

fn subscribe_to_server(state: &mut DartState, server: &Address) -> anyhow::Result<()> {
    state.client.server = Some(SyncServerState {
                address: server.clone(),
                connection: ConnectionStatus::Connecting(0),
                chat_state: ChatState {
                    chat_history: Vec::new(),
                    user_presence: HashMap::new(),
                },
            });
    let send_body : Vec<u8> = serde_json::to_vec(&DartMessage::ServerRequest(ServerRequest::Subscribe)).unwrap();

    // TODO await response and retry?
    Request::new()
        .target(server)
        .body(send_body)
        .send()
        .unwrap();
    
    Ok(())
}
