use dartfrog_lib::*;
use kinode_process_lib::{call_init, http, Address};
use serde::{Serialize, Deserialize};

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
pub enum AppUpdate {
    Chat(ChatUpdate),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChatUpdate {
    Message(ChatMessage),
    FullMessageHistory(Vec<ChatMessage>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppRequest {
    Chat(ChatRequest),
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChatRequest {
    SendMessage(String),
}

#[derive(Debug, Clone)]
pub struct ChatService {
    pub last_message_id: u64,
    pub messages: Vec<ChatMessage>,
}

pub fn new_chat_service() -> ChatService {
    ChatService {
        last_message_id: 0,
        messages: Vec::new(),
    }
}

#[derive(Debug, Clone)]
pub struct AppState {
    pub provider: ProviderState<ChatService, DefaultAppClientState>,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            provider: ProviderState::<ChatService, DefaultAppClientState>::new(),
        }
    }
}

impl AppServiceState for ChatService {
    fn new() -> Self {
        ChatService {
            last_message_id: 0,
            messages: Vec::new(),
        }
    }

    fn handle_unsubscribe(&mut self, _subscriber_node: String, _our: &Address, _service: &Service) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_subscribe(&mut self, subscriber_node: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        let chat_history = ChatUpdate::FullMessageHistory(self.messages.clone());
        let update = AppUpdate::Chat(chat_history);
        update_subscriber(update, &subscriber_node, our, service)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        let request = serde_json::from_str::<AppRequest>(&req)?;
        match request {
            AppRequest::Chat(chat_request) => {
                match chat_request {
                    ChatRequest::SendMessage(msg) => {
                        const MAX_CHAT_MESSAGE_LENGTH: usize = 2048;
                        let msg = if msg.len() > MAX_CHAT_MESSAGE_LENGTH {
                            msg[..MAX_CHAT_MESSAGE_LENGTH].to_string()
                        } else {
                            msg
                        };

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
                        let chat_update = ChatUpdate::Message(chat_msg.clone());
                        let update = AppUpdate::Chat(chat_update);
                        update_subscribers(update, our, service)?;
                    }
                }
            }
        }
        Ok(())
    }
}

call_init!(init);
fn init(our: Address) {
    println!("init chat");
    let mut state = AppState::new();

    let try_ui = http::secure_serve_ui(&our, "chat-ui", vec!["/", "*"]);
    http::secure_bind_ws_path("/", true).unwrap();

    match try_ui {
        Ok(()) => {}
        Err(e) => {
            println!("chat.wasm error starting ui: {:?}", e);
        }
    };

    loop {
        match provider_handle_message(&our, &mut state.provider) {
            Ok(()) => {}
            Err(e) => {
                println!("chat.wasm error handling message: {:?}", e);
            }
        };
    }
}