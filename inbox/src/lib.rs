use std::{collections::HashMap, time::{SystemTime, UNIX_EPOCH}};

use common::{get_server_address, handle_plugin_update, send_to_frontend, update_subscriber_clients, update_subscribers, DartMessage, DefaultPluginClientState, DefaultPluginServiceState, PluginClientState, PluginMessage, PluginMetadata, PluginServiceState, PluginState, ServerRequest, ServiceAccess, ServiceId, ServiceVisibility};
use kinode_process_lib::{await_message, call_init, println, Address, Request};
use serde::{Deserialize, Serialize};


wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});


#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InboxUpdate {
    Inbox(String, Inbox),
    AllInboxes(Vec<(String, Inbox)>),
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum InboxRequest {
    HostSendMessage(String, String), // send_to, message
    NewMessage(String, String) // from, message
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InboxMessage {
    pub sender: String,
    pub message: String,
    pub time: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Inbox {
    pub messages: Vec<InboxMessage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InboxService {
    pub inboxes: HashMap<String, Inbox>,
}

pub fn new_inbox_service() -> InboxService {
    InboxService {
        inboxes: HashMap::new(),
    }
}

#[derive(Debug, Clone)]
pub struct AppState {
    pub plugin: PluginState<InboxService, DefaultPluginClientState>,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            plugin: PluginState::<InboxService, DefaultPluginClientState>::new(),
        }
    }
}

fn get_now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

impl PluginServiceState for InboxService {

    fn new() -> Self {
        InboxService {
            inboxes: HashMap::new(),
        }
    }
    fn handle_unsubscribe(&mut self, _subscriber_node: String, _our: &Address, _metadata: &PluginMetadata) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_subscribe(&mut self, _subscriber_node: String, our: &Address, metadata: &PluginMetadata) -> anyhow::Result<()> {
        println!("inbox handle_subscribe");

        let upd = InboxUpdate::AllInboxes(self.inboxes.iter().map(|(k, v)| (k.clone(), v.clone())).collect());
        match update_subscribers(our, upd, metadata) {
            Ok(()) => {}
            Err(e) => {
                println!("error sending update to subscribers: {:?}", e);
            }
        }
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: String, our: &Address, metadata: &PluginMetadata) -> anyhow::Result<()> {
        println!("inbox handle_subscribe");
        let Ok(request) = serde_json::from_str::<InboxRequest>(&req) else {
            println!("error parsing request: {:?}", req);
            return Ok(());
        };
        match request {
            InboxRequest::NewMessage(msg_from, message) => {
                let inbox = self.inboxes.entry(msg_from.clone()).or_insert(Inbox {
                    messages: vec![],
                });
                inbox.messages.push(InboxMessage {
                    sender: msg_from.clone(),
                    message: message.clone(),
                    time: get_now(),
                });
                let upd = InboxUpdate::Inbox(msg_from, inbox.clone());

                match update_subscribers(our, upd, metadata) {
                    Ok(()) => {}
                    Err(e) => {
                        println!("error sending update to subscribers: {:?}", e);
                    }
                }
            }
            InboxRequest::HostSendMessage(send_to, message) => {
                // assert that from is our
                if from != our.node() {
                    return Ok(())
                }
                let inbox = self.inboxes.entry(send_to.clone()).or_insert(Inbox {
                    messages: vec![],
                });
                inbox.messages.push(InboxMessage {
                    sender: our.node().to_string(),
                    message: message.clone(),
                    time: get_now(),
                });

                // send to the sender
                let req = InboxRequest::NewMessage(our.node().to_string(), message.clone());
                let recipient_address = get_server_address(&send_to.as_str());
                let sent =  Request::to(recipient_address)
                    .body(serde_json::to_vec(&req)?)
                    .send();
        
                match sent {
                    Ok(()) => {}
                    Err(e) => {
                        println!("error sending update to sender: {:?}", e);
                    }
                }

                let upd = InboxUpdate::Inbox(send_to.clone(), inbox.clone());

                match update_subscribers(our, upd, metadata) {
                    Ok(()) => {}
                    Err(e) => {
                        println!("error sending update to subscribers: {:?}", e);
                    }
                }
            }
        }
        Ok(())
    }
}


fn handle_message(our: &Address, state: &mut AppState) -> anyhow::Result<()> {
    let message = await_message()?;

    let body = message.body();
    let source = message.source();


    if !message.is_request() {
        return Err(anyhow::anyhow!("unexpected Response: {:?}", message));
    }
    
    if let Ok(plugin_message) = serde_json::from_slice::<PluginMessage>(&body) {
        if let Err(e) = handle_plugin_update(plugin_message, &mut state.plugin, our, source) {
            println!("inbox error handling plugin update: {:?}", e);
        }
    }
    if let Ok(inbox_request) = serde_json::from_slice::<InboxRequest>(&body) {
        // iterate over state.services
        for (_service_id, service) in state.plugin.services.iter_mut() {
            let _ = service.state.handle_request(source.node().to_string(), serde_json::to_string(&inbox_request)?, our, &service.metadata);
        }
    }
    Ok(())
}

const INBOX_PROCESS_NAME: &str = "inbox:dartfrog:herobrine.os";

call_init!(init);
fn init(our: Address) {
    println!("init inbox");
    let mut state: AppState = AppState::new();

    let try_ui = kinode_process_lib::http::serve_ui(&our, "inbox-ui", true, false, vec!["/"]);
    match try_ui {
        Ok(()) => {}
        Err(e) => {
            println!("inbox error starting ui: {:?}", e)
        }
    };

    let create_service_req = DartMessage::ServerRequest(
        ServerRequest::CreateService(
            ServiceId {
                node: our.node().to_string(),
                id: "inbox".to_string(),
            },
            vec![INBOX_PROCESS_NAME.to_string()], // Vec<String> plugins
            ServiceVisibility::Hidden, // ServiceVisibility
            ServiceAccess::HostOnly, // ServiceAccess
            vec![] // Vec<String> whitelist
        )
    );
    let service_body = serde_json::to_vec(&create_service_req).unwrap();
    let create_service = Request::to(get_server_address(our.node()))
        .body(service_body)
        .send();

    match create_service {
        Ok(()) => {}
        Err(e) => {
            println!("inbox error creating service: {:?}", e);
        }
    }

    loop {
        match handle_message(&our, &mut state) {
            Ok(()) => {}
            Err(e) => {
                println!("inbox error handling message: {:?}", e)
            }
        };
    }
}
