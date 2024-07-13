use std::collections::{HashMap, HashSet};
use std::str::FromStr;
use std::time::{SystemTime, UNIX_EPOCH};
use std::hash::{Hash, Hasher};

use dartfrog_lib::*;
mod constants;
use kinode_process_lib::{http, await_message, call_init, println, Address, Request,
    get_blob,
    LazyLoadBlob,
    http::{
        send_ws_push, HttpServerRequest,
        WsMessageType,
    },
};
use serde::{Deserialize, Serialize};

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Consumer {
    pub ws_channel_id: u32,
    pub last_active: u64,
}

impl Consumer {
    pub fn new(id:u32) -> Self {
        Consumer {
            ws_channel_id: id,
            last_active: get_now(),
        }
    }
}
impl Hash for Consumer{
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.ws_channel_id.hash(state);
    }
}
#[derive(Debug, Clone)]
pub struct DartfrogState {
    pub consumers: HashMap<u32, Consumer>,
    pub local_services: HashMap<String, Service>
}

impl DartfrogState {
    pub fn new() -> Self {
        DartfrogState {
            consumers: HashMap::new(),
            local_services: HashMap::new(),
        }
    }
}

fn get_now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

const CONSUMER_TIMEOUT : u64 = 10*60; //10 minutes


fn update_consumer (
    websocket_id: u32,
    update: DartfrogOutput,
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

fn update_all_consumers(
    state: &DartfrogState,
    update: DartfrogOutput,
) -> anyhow::Result<()> {
    for consumer in state.consumers.values() {
        update_consumer(consumer.ws_channel_id, update.clone())?;
    }
    Ok(())
}

fn handle_http_server_request(
    our: &Address,
    state: &mut DartfrogState,
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
            state.consumers.insert(
                channel_id,
                Consumer {
                    ws_channel_id: channel_id,
                    last_active: now,
                },
            );

            let update = DartfrogOutput::ServiceList(our.node.clone(), state.local_services.values().cloned().collect());
            update_consumer(channel_id, update)?;
        }
        HttpServerRequest::WebSocketPush { channel_id, message_type} => {
            // take the opportunity to kill any old consumers
            // TODO this is weird if the calling consumer times out
            state.consumers.retain(|_, consumer| {
                get_now() - consumer.last_active <= CONSUMER_TIMEOUT
            });

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
                DartfrogInput::CreateService(service_name, process_name) => {
                    let address_str = format!("{}@{}", our.node, process_name);
                    let address = Address::from_str(address_str.as_str());
                    match address {
                        Ok(address) => {
                            // forward the request
                            let req = DartfrogAppInput::CreateService(service_name);
                            poke(&address, req)?;
                        }
                        _ => {
                        }
                    }

                },
                DartfrogInput::RequestServiceList(node) => {
                    let req = DartfrogInput::RequestServiceList(node.clone());
                    let address = get_server_address(&node);
                    poke(&address, req)?;
                },
                DartfrogInput::RequestFullServiceList => {
                    // TODO
                },
                DartfrogInput::DeleteService(id) => {
                    // TODO
                }
            }
        }
        HttpServerRequest::WebSocketClose(channel_id) => {
            state.consumers.remove(&channel_id);
        }
        HttpServerRequest::Http(_request) => {
        }
    };

    Ok(())
}

fn handle_df_app_output(
    our: &Address,
    state: &mut DartfrogState,
    source: &Address,
    app_message: DartfrogAppOutput,
) -> anyhow::Result<()> {
    if source.node != our.node {
        return Ok(());
    }

    match app_message {
        DartfrogAppOutput::Service(service) => {
            // source process == service process
            if service.id.address.node != source.node ||
               service.id.address.process != source.process
            {
                // ignore
                return Ok(())
            }
            state.local_services.insert(service.id.to_string(), service.clone());
            let update = DartfrogOutput::Service(our.node.clone(), service);
            update_all_consumers(state, update)?;
        }
    }
    Ok(())
}

fn handle_message(our: &Address, state: &mut DartfrogState) -> anyhow::Result<()> {
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
        if let Ok(app_message) = serde_json::from_slice::<DartfrogAppOutput>(&body) {
            handle_df_app_output(our, state, source, app_message)?;
        }
        Ok(())
    }
}

call_init!(init);
fn init(our: Address) {
    println!("initializing");
    
    // Serve the index.html and other UI files found in pkg/ui at the root path.
    http::secure_serve_ui(&our, "ui", vec!["/", "*"]).unwrap();

    // Allow websocket to be opened at / (our process ID will be prepended).
    http::secure_bind_ws_path("/", true).unwrap();

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

    let mut state = DartfrogState::new();

    loop {
        match handle_message(&our, &mut state) {
            Ok(()) => {}
            Err(e) => {
                println!("handle_message error: {:?}", e);
            }
        };
    }
}