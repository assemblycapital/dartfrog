use std::{time::{SystemTime, UNIX_EPOCH}, usize::MAX};
use common::{handle_message, update_client, update_subscribers, PluginMetadata, PluginState};
use kinode_process_lib::{call_init, println, Address};
use serde::{Deserialize, Serialize};

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});

#[derive(Debug, Clone, Serialize)]
pub struct ChatMessage {
    pub id: u64,
    pub time: u64,
    pub from: String,
    pub msg: String,
}

#[derive(Debug, Clone, Serialize)]
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
    pub last_message_id: u64,
    pub messages: Vec<ChatMessage>,
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
            last_message_id: 0,
            messages: Vec::new(),
        }
    }

    fn handle_exit(&mut self, _from: String, _meta: &PluginMetadata, _our: &Address) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_join(&mut self, from: String, meta: &PluginMetadata, our: &Address) -> anyhow::Result<()> {
        let chat_history = ChatUpdate::FullMessageHistory(self.messages.clone());
        update_client(our, from, chat_history, meta)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: String, meta: &PluginMetadata, our: &Address) -> anyhow::Result<()> {
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
                update_subscribers(our, chat_upd, meta)?;
            }
        }
        Ok(())
    }
}

call_init!(init);
fn init(our: Address) {
    let mut meta: Option<PluginMetadata> = None;
    let mut state: ChatState = ChatState::new();
    loop {
        match handle_message(&our, &mut state, &mut meta) {
            Ok(()) => {}
            Err(e) => {
                if e.to_string().contains("kill message received") {
                    // shut down from parent Kill request
                    break;
                }
            }
        };
    }
}
