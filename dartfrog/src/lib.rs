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
struct ServerStatus {
    pub server_node: String,
    pub status: ConnectionStatus,
}

#[derive(Debug, Serialize, Deserialize)]
enum WsUpdate{
    NewChat(ChatMessage),
    NewChatState(ChatState),
    NewPresenceState(HashMap<String, Presence>),
    ServerStatus(ServerStatus),
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

#[derive(Debug, Serialize, Deserialize)]
struct DartState {
    pub client: ClientState,
    pub server: ServerState,
}
#[derive(Debug, Serialize, Deserialize, Clone)]
struct Presence {
    pub time: u64,
    pub was_online_at_time: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ChatState {
    pub latest_chat_msg_id: u64,
    pub chat_history: Vec<ChatMessage>,
    pub user_presence: HashMap<String, Presence>,
    pub banned_users: HashSet<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ServerState {
    pub chat_state: ChatState,
    pub subscribers: HashSet<Address>,
    pub last_sent_presence: u64,
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

#[derive(Debug, Serialize, Deserialize, Clone)]
enum ServerRequest {
    ChatMessage(String),
    Subscribe,
    Unsubscribe,
    PresenceHeartbeat,
    RequestChatState,
    Ban(String),
    UnBan(String),
    WipeChatHistory,
}
#[derive(Debug, Serialize, Deserialize)]
enum UpdateFromServer {
    ChatMessage(ChatMessage),
    ChatState(ChatState),
    SubscribeAck,
    KickSubscriber,
    NewPresenceState(HashMap<String, Presence>),
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

fn send_server_updates(state: &DartState, update: UpdateFromServer) {
    let value = DartMessage::UpdateFromServer(update);
    for sub in state.server.subscribers.iter() {
        let send_body : Vec<u8> =
            serde_json::to_vec(&value).unwrap();
        Request::new()
            .target(sub)
            .body(send_body)
            .send()
            .unwrap();
    }
}

fn handle_server_request(our: &Address, state: &mut DartState, source: Address, req: ServerRequest) -> anyhow::Result<()> {
    // println!("server request: {:?}", req);
    let now = {
        let start = SystemTime::now();
        start.duration_since(UNIX_EPOCH).unwrap().as_secs() 
    };
    match req {
        ServerRequest::PresenceHeartbeat => {
            state.server.chat_state.user_presence.insert(source.node.clone(), Presence{time:now, was_online_at_time: true});
            // if last sent presence is more than 2 minutes ago, send new presence state
            if (now - state.server.last_sent_presence) > 2*60 {
                send_server_updates(state, UpdateFromServer::NewPresenceState(state.server.chat_state.user_presence.clone()));
                state.server.last_sent_presence = now;
            }
            // if any user has been offline for more than 5 minutes, kick and remove from subscribers
            let offline_duration = 5*60; // 5 minutes in seconds
            let mut to_remove = Vec::new();
            for (node, presence) in state.server.chat_state.user_presence.iter() {
                if (now - presence.time) > offline_duration {
                    to_remove.push(node.clone());
                }
            }

            for node in to_remove {
                state.server.chat_state.user_presence.remove(&node);
                state.server.subscribers.retain(|address| address.node != node);
                let _ = poke_node(node.clone(), UpdateFromServer::KickSubscriber);
            }
        }
        ServerRequest::ChatMessage(msg) => {
            if(state.server.chat_state.banned_users.contains(&source.node)) {
                return Ok(());
            }
            state.server.chat_state.latest_chat_msg_id += 1;
            let chat_msg = ChatMessage {
                id: state.server.chat_state.latest_chat_msg_id,
                time: now,
                from: source.node.clone(),
                msg: safe_trim_to_boundary(msg, 2048)
            };
            // state.server.chat_state.chat_history.push(chat_msg.clone());
            let chat_history = &mut state.server.chat_state.chat_history;
            const MAX_CHAT_HISTORY: usize = 32;
            if chat_history.len() >= MAX_CHAT_HISTORY {
                chat_history.remove(0);
            }
            chat_history.push(chat_msg.clone());

            send_server_updates(state, UpdateFromServer::ChatMessage(chat_msg.clone()));
            state.server.chat_state.user_presence.insert(source.node.clone(), Presence{time:now, was_online_at_time: true});
        }
        ServerRequest::RequestChatState => {
            let send_body : Vec<u8> = 
                serde_json::to_vec(&DartMessage::UpdateFromServer(UpdateFromServer::ChatState(state.server.chat_state.clone()))).unwrap();
            Request::new()
                .target(source)
                .body(send_body)
                .send()
                .unwrap();

        }
        ServerRequest::Subscribe => {
            state.server.subscribers.insert(source.clone());
            state.server.chat_state.user_presence.insert(source.node.clone(), Presence{time:now, was_online_at_time: true});
            let send_body : Vec<u8> = 
                serde_json::to_vec(&DartMessage::UpdateFromServer(UpdateFromServer::ChatState(state.server.chat_state.clone()))).unwrap();
            Request::new()
                .target(source.clone()) // Clone the source variable
                .body(send_body)
                .send()
                .unwrap();
            let send_body : Vec<u8> = 
                serde_json::to_vec(&DartMessage::UpdateFromServer(UpdateFromServer::SubscribeAck)).unwrap();
            Request::new()
                .target(source.clone()) // Clone the source variable
                .body(send_body)
                .send()
                .unwrap();

            if(state.server.chat_state.banned_users.contains(&source.node)) {
                return Ok(());
            }
            send_server_updates(state, UpdateFromServer::NewPresenceState(state.server.chat_state.user_presence.clone()));
        }
        ServerRequest::Unsubscribe => {
            state.server.subscribers.remove(&source);
            state.server.chat_state.user_presence.insert(source.node.clone(), Presence{time:now, was_online_at_time: false});
            send_server_updates(state, UpdateFromServer::NewPresenceState(state.server.chat_state.user_presence.clone()));
        }
        ServerRequest::Ban(user) => {
            if source.node != SERVER {
                return Ok(());
            }
            if user == SERVER {
                // don't ban yourself
                return Ok(());
            }
            state.server.chat_state.banned_users.insert(user);
            send_server_updates(state, UpdateFromServer::ChatState(state.server.chat_state.clone()));
        }
        ServerRequest::UnBan(user) => {
            if source.node != SERVER {
                return Ok(());
            }
            state.server.chat_state.banned_users.remove(&user);
            send_server_updates(state, UpdateFromServer::ChatState(state.server.chat_state.clone()));
        }
        ServerRequest::WipeChatHistory => {
            if source.node != SERVER {
                return Ok(());
            }
            state.server.chat_state.chat_history.clear();
            send_server_updates(state, UpdateFromServer::ChatState(state.server.chat_state.clone()));
        }
    }
    Ok(())
}

fn handle_server_update(our: &Address, state: &mut DartState, source: Address, req: UpdateFromServer) -> anyhow::Result<()> {
    if let Some(server) = &mut state.client.server {
        if source != server.address {
            return Ok(());
        }
        match req {
            UpdateFromServer::ChatMessage(chat)=> {
                send_ws_update(WsUpdate::NewChat(chat), &state.client.ws_channels).unwrap();
            }
            UpdateFromServer::SubscribeAck => {
                let now = {
                    let start = SystemTime::now();
                    start.duration_since(UNIX_EPOCH).unwrap().as_secs() 
                };
                server.connection = ConnectionStatus::Connected(now);
                send_ws_update(WsUpdate::ServerStatus(ServerStatus {
                    server_node: server.address.node.to_string(),
                    status: ConnectionStatus::Connected(now),
                }), &state.client.ws_channels).unwrap();
            }
            UpdateFromServer::KickSubscriber => {
                state.client.server = None;
                // update frontend?
                // this currently only happens if the frontend is closed / offline until a timeout happens
            }
            UpdateFromServer::ChatState(chat_state)=> {
                server.chat_state = chat_state.clone();
                send_ws_update(WsUpdate::NewChatState(chat_state), &state.client.ws_channels).unwrap();
            }
            UpdateFromServer::NewPresenceState(presence)=> {
                send_ws_update(WsUpdate::NewPresenceState(presence), &state.client.ws_channels).unwrap();
            }
        }
        Ok(())

    } else {
        return Ok(());
    }
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
    // println!("client request: {:?}", req);
    if source.node != *our.node {
        return Err(anyhow::anyhow!("invalid source: {:?}", source));
    }

    match req {
        ClientRequest::SendToServer(freq) => {
            match freq.clone() {
                ServerRequest::ChatMessage(msg) => {
                    let trimmed_msg = safe_trim_to_boundary(msg, 2048);
                    let chat_req = ServerRequest::ChatMessage(trimmed_msg.clone());
                    let command = parse_chat_command(&trimmed_msg);
                    match command {
                        Some(command_req) => {
                            poke_server(state, command_req)?;
                            poke_server(state, chat_req)?;
                        }
                        _ => {
                            poke_server(state, chat_req)?;
                            
                        }
                    }
                }
                _ => {
                    poke_server(state, freq)?;
                }
            }
        }
        ClientRequest::SetServer(mad) => {
            if let Some(add) = mad {
                subscribe_to_server(state, &add)?;
            } else {
                poke_server(state, ServerRequest::Unsubscribe)?;
                let server = &mut state.client.server;
                if let Some(server) = server {
                    let update = WsUpdate::ServerStatus(ServerStatus {
                        server_node: server.address.node.to_string(),
                        status: ConnectionStatus::Disconnected,
                    });
                    let _ = send_ws_update(update, &state.client.ws_channels);
                }
                state.client.server = None;
            }
        }
    }
    Ok(())
}

fn parse_chat_command(input: &str) -> Option<ServerRequest> {
    let parts: Vec<&str> = input.split_whitespace().collect();

    if parts.len() < 1 {
        None
    } else if parts[0] == "/ban" {
        let who = parts[1].to_string();
        Some(ServerRequest::Ban(who.clone()))
    } else if parts[0] == "/unban" {
        let who = parts[1].to_string();
        Some(ServerRequest::UnBan(who.clone()))
    } else if parts[0] == "/wipe" {
        Some(ServerRequest::WipeChatHistory)
    } else {
        None
    }
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
            state.client.ws_channels.insert(channel_id);
            // send last chat state if available?
            // if let Some(server) = &state.client.server {
            //     let chat_state = server.chat_state.clone();
            //     send_ws_update(our, WsUpdate::NewChatState(chat_state), &state.client.ws_channels).unwrap();
            // }
        }
        HttpServerRequest::WebSocketPush { .. } => {
            // let Some(blob) = get_blob() else {
            //     return Ok(());
            // };
            // take messages on POST request instead
        }
        HttpServerRequest::WebSocketClose(channel_id) => {
            state.client.ws_channels.remove(&channel_id);
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
                if our.node != SERVER {
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

const SERVER : &str = "waterhouse.os";
const PROCESS_ID : &str = "dartfrog:dartfrog:herobrine.os";
fn get_server_address(node_id: &str) -> String {
    format!("{}@{}", node_id, PROCESS_ID)
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
                latest_chat_msg_id: 0,
                chat_history: Vec::new(),
                user_presence: HashMap::new(),
                banned_users: HashSet::new(),
            },
            subscribers: HashSet::new(),
            last_sent_presence: 0,
        },
    };

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

fn poke_node(node: String, req: UpdateFromServer) -> anyhow::Result<()> {
    let send_body : Vec<u8> = serde_json::to_vec(&DartMessage::UpdateFromServer(req)).unwrap();
    Request::new()
        .target(Address::from_str(&get_server_address(&node)).unwrap())
        .body(send_body)
        .send()
        .unwrap();
    Ok(())
}

fn poke_server(state: &DartState, req: ServerRequest) -> anyhow::Result<()> {
    if let Some(server) = &state.client.server {
        let send_body : Vec<u8> = serde_json::to_vec(&DartMessage::ServerRequest(req)).unwrap();
        Request::new()
            .target(server.address.clone())
            .body(send_body)
            .send()
            .unwrap();
        Ok(())
    } else {
        Ok(())
    }
}

fn set_new_server(state: &mut DartState, server: &Address) -> anyhow::Result<()> {
    let now = {
        let start = SystemTime::now();
        start.duration_since(UNIX_EPOCH).unwrap().as_secs() 
    };
    state.client.server = Some(SyncServerState {
                address: server.clone(),
                connection: ConnectionStatus::Connecting(now),
                chat_state: ChatState {
                    latest_chat_msg_id: 0,
                    chat_history: Vec::new(),
                    user_presence: HashMap::new(),
                    banned_users: HashSet::new(),
                },
            });
    send_ws_update(WsUpdate::ServerStatus(ServerStatus {
        server_node: server.node.to_string(),
        status: ConnectionStatus::Connecting(now),
    }), &state.client.ws_channels).unwrap();
    Ok(())
}

fn subscribe_to_server(state: &mut DartState, server: &Address) -> anyhow::Result<()> {
    if let Some(state_server) = &mut state.client.server {
        if state_server.address != *server {
            poke_server(state, ServerRequest::Unsubscribe)?;
            set_new_server(state, server)?;
        }
    } else {
        set_new_server(state, server)?;
    }
    
    let send_body : Vec<u8> = serde_json::to_vec(&DartMessage::ServerRequest(ServerRequest::Subscribe)).unwrap();
    // await response and retry?
    Request::new()
        .target(server)
        .body(send_body)
        .send()
        .unwrap();
    
    Ok(())
}
