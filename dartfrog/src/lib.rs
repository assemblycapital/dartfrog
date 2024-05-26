use serde::{Deserialize, Serialize};
use std::char;
use std::io::Read;
use std::{str::FromStr};
use std::collections::{HashMap, HashSet};
use std::time::{SystemTime, UNIX_EPOCH};

mod constants;
use kinode_process_lib::{http, await_message, call_init, println, Address, ProcessId, Request, Response,
    get_blob,
    LazyLoadBlob,
    http::{
        bind_http_path, bind_ws_path, send_response, send_ws_push, serve_ui, HttpServerRequest,
        StatusCode, WsMessageType, IncomingHttpRequest,
    },
};

wit_bindgen::generate!({
    path: "wit",
    world: "process",
});

#[derive(Debug, Serialize, Deserialize)]
struct WsDartUpdate{
    time: u64,
    from: String,
    msg: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChatMessage {
    time: u64,
    from: String,
    msg: String,
}
#[derive(Debug, Serialize, Deserialize)]
struct DartState {
    pub server: Option<Address>,        // dart broadcast server we are subscribed to
    pub subscribers: HashSet<Address>,  // subscribers to dart broadcasts
    pub ws_clients: HashSet<u32>,       // websocket client ids
    pub chat_history: Vec<(String, String)>,
}


#[derive(Debug, Serialize, Deserialize)]
enum ServerRequest {
    ChatMessage(String),
    Subscribe,
    Unsubscribe,
}
#[derive(Debug, Serialize, Deserialize)]
enum ClientRequest {
    ChatMessageFromServer(ChatMessage),
    SendToServer(ServerRequest),
    SetServer(Option<Address>),
}

#[derive(Debug, Serialize, Deserialize)]
enum DartMessage {
    ServerRequest(ServerRequest),
    ClientRequest(ClientRequest)
}

fn handle_server_request(our: &Address, state: &mut DartState, source: Address, req: ServerRequest) -> anyhow::Result<()> {
    println!("server request: {:?}", req);
    match req {
        ServerRequest::ChatMessage(msg) => {
            for sub in state.subscribers.iter() {
                let now = {
                    let start = SystemTime::now();
                    start.duration_since(UNIX_EPOCH).unwrap().as_secs() 
                };

                let chatmsg = ChatMessage {
                    time: now,
                    from: source.node.clone(),
                    msg: msg.clone(),
                };
                let send_body : Vec<u8> = serde_json::to_vec(&DartMessage::ClientRequest(ClientRequest::ChatMessageFromServer(chatmsg))).unwrap();
                Request::new()
                    .target(sub)
                    .body(send_body)
                    .send()
                    .unwrap();
            }
        }
        ServerRequest::Subscribe => {
            state.subscribers.insert(source.clone());
        }
        ServerRequest::Unsubscribe => {
            state.subscribers.remove(&source);
        }
    }
    Ok(())
}

fn handle_client_request(our: &Address, state: &mut DartState, source: Address, req: ClientRequest) -> anyhow::Result<()> {
    println!("client request: {:?}", req);
    match req {
        ClientRequest::ChatMessageFromServer(chat)=> {
            if let Some(server) = &state.server {
                if source == *server {
                    send_ws_update(our, chat.time, chat.from, chat.msg, &state.ws_clients).unwrap();
                }
            }
        }
        ClientRequest::SendToServer(freq) => {
            if source.node != *our.node {
                return Err(anyhow::anyhow!("invalid source: {:?}", source));
            }
            if let Some(server) = &state.server {
                let send_body : Vec<u8> = serde_json::to_vec(&DartMessage::ServerRequest(freq)).unwrap();
                Request::new()
                    .target(server)
                    .body(send_body)
                    .send()
                    .unwrap();

            }
        }
        ClientRequest::SetServer(mad) => {
            if let Some(add) = mad {
            } else {
                // disconnecting
                // send unsubscribe
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
            state.ws_clients.insert(channel_id);
        }
        HttpServerRequest::WebSocketPush { .. } => {
            let Some(blob) = get_blob() else {
                return Ok(());
            };
        }
        HttpServerRequest::WebSocketClose(channel_id) => {
            state.ws_clients.remove(&channel_id);
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
            _ => {
                return Err(anyhow::anyhow!("unexpected Request: {:?}", message));
            }
        }
        Ok(())

    }

}
fn send_ws_update(
    our: &Address,
    time: u64,
    from: String,
    msg: String,
    open_channels: &HashSet<u32>,
) -> anyhow::Result<()> {

    for channel in open_channels {
          // Generate a blob for the new message
          let blob = LazyLoadBlob {
            mime: Some("application/json".to_string()),
            bytes: serde_json::json!({
                "WsDartUpdate": WsDartUpdate {
                    time: time.clone(),
                    from: from.clone(),
                    msg: msg.clone(),
                }
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

const SERVER : &str = "fake.dev@dartfrog:dartfrog:template.os";
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



    let server = Address::from_str(SERVER).unwrap();
    let mut state = DartState {
        server: Some(server.clone()),
        subscribers: HashSet::new(),
        ws_clients: HashSet::new(),
        chat_history: Vec::new(),
    };

    println!("hello dartfrog");
    // subscribe to SERVER
    // TODO await response and retry?
    let send_body : Vec<u8> = serde_json::to_vec(&DartMessage::ServerRequest(ServerRequest::Subscribe)).unwrap();
    Request::new()
        .target(server)
        .body(send_body)
        .send()
        .unwrap();

    loop {
        match handle_message(&our, &mut state) {
            Ok(()) => {}
            Err(e) => {
                println!("error: {:?}", e);
            }
        };
    }
}
