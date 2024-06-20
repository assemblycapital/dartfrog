use std::{collections::HashMap, time::{SystemTime, UNIX_EPOCH}};
use common::{get_server_address, plugin_consumer_output, update_client, update_subscribers, PluginConsumerInput, PluginMessage, PluginMetadata, PluginServiceInput, PluginState, ServiceId};
use kinode_process_lib::{await_message, call_init, println, Address};
use serde::{Deserialize, Serialize};

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: u64,
    pub time: u64,
    pub from: String,
    pub msg: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChatUpdate {
    Message(ChatMessage),
    FullMessageHistory(Vec<ChatMessage>),
}

#[derive(Debug, Clone, Deserialize)]
pub enum ChatRequest {
    SendMessage(String),
}

#[derive(Debug, Clone)]
pub struct ChatState {
    pub metadata: PluginMetadata,
    pub last_message_id: u64,
    pub messages: Vec<ChatMessage>,
}

#[derive(Debug, Clone)]
pub struct ChatStates {
    pub services: HashMap<ServiceId, ChatState>,
    pub clients: HashMap<ServiceId, ChatState>,
}
impl ChatStates {
    pub fn new() -> Self {
        ChatStates {
            services: HashMap::new(),
            clients: HashMap::new(),
        }
    }
}

fn get_now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

impl PluginState for ChatState {
    fn new() -> Self {
        ChatState {
            metadata: PluginMetadata::new(),
            last_message_id: 0,
            messages: Vec::new(),
        }
    }

    fn handle_exit(&mut self, _from: String, _our: &Address) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_join(&mut self, from: String, our: &Address) -> anyhow::Result<()> {
        let chat_history = ChatUpdate::FullMessageHistory(self.messages.clone());
        println!("chat sending initial state from service");
        update_client(our, from, chat_history, &self.metadata)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: String, our: &Address) -> anyhow::Result<()> {
        let Ok(request) = serde_json::from_str::<ChatRequest>(&req) else {
            println!("error parsing request: {:?}", req);
            return Ok(());
        };
        match request {
            ChatRequest::SendMessage(msg) => {
                let chat_msg = ChatMessage {
                    id: self.last_message_id,
                    time: get_now(),
                    from: from.clone(),
                    msg: msg,
                };

                const MAX_CHAT_HISTORY: usize = 64;
                if self.messages.len() > MAX_CHAT_HISTORY {
                    self.messages = self.messages.split_off(self.messages.len() - MAX_CHAT_HISTORY);
                }

                self.last_message_id += 1;
                self.messages.push(chat_msg.clone());
                let chat_upd = ChatUpdate::Message(chat_msg.clone());
                update_subscribers(our, chat_upd, &self.metadata)?;
            }
        }
        Ok(())
    }
}

fn handle_message(our: &Address, state: &mut ChatStates) -> anyhow::Result<()> {
    let message = await_message()?;

    let body = message.body();
    let source = message.source();

    // println!("chat received message");

    if source != &get_server_address(our.node()) {
        println!("chat received message from unknown source: {:?}", source);
        return Ok(());
    }

    if !message.is_request() {
        return Err(anyhow::anyhow!("unexpected Response: {:?}", message));
    }
    
    match serde_json::from_slice(body)? {
        PluginMessage::ConsumerInput(service_id, poke) => {
            let chat_state = state.clients.entry(service_id.clone()).or_insert_with(ChatState::new);
            match poke {
                PluginConsumerInput::ServiceUpdate(update) => {
                    // println!("chat message: sid: {:?}, poke: {:?}", service_id, update);
                    // send to frontend
                    let parsed_update = serde_json::from_str::<ChatUpdate>(&update);
                    match parsed_update {   
                        Ok(parsed_update) => {
                            match parsed_update {
                                ChatUpdate::Message(msg) => {
                                    chat_state.messages.push(msg);
                                }
                                ChatUpdate::FullMessageHistory(history) => {
                                    chat_state.messages = history;
                                }
                            }
                            plugin_consumer_output(&service_id, &update, our);
                        }
                        Err(e) => {
                            println!("error parsing update: {:?}", e);
                        }
                    }
                }
                PluginConsumerInput::ConsumerJoined => {
                    println!("consumer joined chat!");
                    let chat_history = serde_json::to_string(&ChatUpdate::FullMessageHistory(chat_state.messages.clone()));
                    match chat_history {
                        Ok(chat_history) => {
                            println!("chat sending initial state from consumer");
                            plugin_consumer_output(&service_id, &chat_history, our);
                        }
                        Err(e) => {
                            println!("error encoding chat history: {:?}", e);
                        }
                    }
                }
                PluginConsumerInput::ConsumerExited => {
                }
            }
        }
        PluginMessage::ServiceInput(service_id, poke) => {

            // println!("chat message: sid: {:?}, poke: {:?}", service_id, poke);

            if let Some(chat_state) = state.services.get_mut(&service_id) {
                match poke {
                    PluginServiceInput::ClientJoined(node) => {
                        chat_state.handle_join(node, our)?;
                    }
                    PluginServiceInput::ClientExited(node) => {
                        chat_state.handle_exit(node, our)?;
                    }
                    PluginServiceInput::ClientRequest(node, req) => {
                        chat_state.handle_request(node, req, our)?;

                    }
                    _ => {
                    }
                }
            } else {
                match poke {
                    PluginServiceInput::Init(meta) => {
                        let mut new_chat_state = ChatState::new();
                        new_chat_state.metadata = meta;

                        state.services.insert(service_id.clone(), new_chat_state);
                    }
                    _ => {
                        println!("message for unknown service: {:?}", service_id);
                    }
                }
            }
        }
        _ => {
            println!("chat received unexpected message: {:?}", message);
        }
    }
    Ok(())
}

call_init!(init);
fn init(our: Address) {
    println!("init chat");
    let mut state: ChatStates = ChatStates::new();

    let try_ui = kinode_process_lib::http::serve_ui(&our, "chat-ui", true, false, vec!["/"]);
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
