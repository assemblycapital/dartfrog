use std::{collections::HashMap, time::{SystemTime, UNIX_EPOCH}};
use common::{get_server_address, handle_plugin_update, send_to_frontend, update_client, update_subscribers, PluginClientState, PluginConsumerInput, PluginMessage, PluginMetadata, PluginServiceInput, PluginServiceState, PluginState, ServiceId};
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
pub struct ChatService {
    // todo move metadata out?
    pub metadata: PluginMetadata,
    pub last_message_id: u64,
    pub messages: Vec<ChatMessage>,
}

pub fn new_chat_service() -> ChatService {
    ChatService {
        metadata: PluginMetadata::new(),
        last_message_id: 0,
        messages: Vec::new(),
    }
}

#[derive(Debug, Clone)]
pub struct ChatClient{
    pub messages: Vec<ChatMessage>,
}

pub fn new_chat_client() -> ChatClient {
    ChatClient {
        messages: Vec::new(),
    }
}

#[derive(Debug, Clone)]
pub struct AppState {
    pub plugin: PluginState<ChatService, ChatClient>,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            plugin: PluginState::<ChatService, ChatClient>::new(),
        }
    }
}
fn get_now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

impl PluginClientState for ChatClient {
    fn new() -> Self {
        ChatClient {
            messages: Vec::new(),
        }
    }
    fn handle_new_frontend(&mut self, our: &Address, metadata: &PluginMetadata) -> anyhow::Result<()> {
        let chat_history = serde_json::to_string(&ChatUpdate::FullMessageHistory(self.messages.clone()));
        match chat_history {
            Ok(chat_history) => {
                println!("chat sending initial state from consumer");
                send_to_frontend(&metadata.service.id, &chat_history, our);
            }
            Err(e) => {
                println!("error encoding chat history: {:?}", e);
            }
        }
        Ok(())
    }
    fn handle_update(&mut self, update: String, our: &Address, metadata: &PluginMetadata) -> anyhow::Result<()> {
        println!("chat client received update: {:?}", update);
        let parsed_update = serde_json::from_str::<ChatUpdate>(&update);
        match parsed_update {   
            Ok(parsed_update) => {
                match parsed_update {
                    ChatUpdate::Message(msg) => {
                        self.messages.push(msg);
                    }
                    ChatUpdate::FullMessageHistory(history) => {
                        self.messages = history;
                    }
                }
                send_to_frontend(&metadata.service.id, &update, our);
            }
            Err(e) => {
                println!("error parsing update: {:?}", e);
            }
        }
        Ok(())
    }
}
impl PluginServiceState for ChatService {

    fn new() -> Self {
        ChatService {
            metadata: PluginMetadata::new(),
            last_message_id: 0,
            messages: Vec::new(),
        }
    }
    fn handle_unsubscribe(&mut self, subscriber_node: String, _our: &Address, _metadata: &PluginMetadata) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_subscribe(&mut self, subscriber_node: String, our: &Address, metadata: &PluginMetadata) -> anyhow::Result<()> {
        let chat_history = ChatUpdate::FullMessageHistory(self.messages.clone());
        println!("chat sending initial state from service");
        update_client(our, subscriber_node, chat_history, metadata)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: String, our: &Address, metadata: &PluginMetadata) -> anyhow::Result<()> {
        let Ok(request) = serde_json::from_str::<ChatRequest>(&req) else {
            println!("error parsing request: {:?}", req);
            return Ok(());
        };
        println!("chat service received request: {:?}", request);
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
                println!("chat service sending update to subscribers");
                match update_subscribers(our, chat_upd, metadata) {
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

    // println!("chat received message");

    if source != &get_server_address(our.node()) {
        println!("chat received message from unknown source: {:?}", source);
        return Ok(());
    }

    if !message.is_request() {
        return Err(anyhow::anyhow!("unexpected Response: {:?}", message));
    }
    
    if let Ok(plugin_message) = serde_json::from_slice::<PluginMessage>(&body) {
        if let Err(e) = handle_plugin_update(plugin_message, &mut state.plugin, our) {
            println!("chat.wasm error handling plugin update: {:?}", e);
        }
    }
    Ok(())
}

call_init!(init);
fn init(our: Address) {
    println!("init chat");
    let mut state: AppState = AppState::new();

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
