use dartfrog_lib::*;
use kinode_process_lib::{call_init, http, Address};

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});

#[derive(Debug)]
struct ChatState {
    messages: Vec<String>,
}

impl AppServiceState for ChatState {
    fn new() -> Self {
        ChatState {
            messages: Vec::new(),
        }
    }

    fn handle_request(&mut self, from: String, req: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        println!("Received request from {}: {}", from, req);
        self.messages.push(format!("{}: {}", from, req));
        Ok(())
    }

    fn handle_subscribe(&mut self, from: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        println!("{} subscribed", from);
        update_subscriber("todo", &from, our, service)
    }

    fn handle_unsubscribe(&mut self, from: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        println!("{} unsubscribed", from);
        Ok(())
    }
}

call_init!(init);
fn init(our: Address) {
    println!("init chat");
    let mut state: ProviderState<ChatState, DefaultAppClientState> = ProviderState::new();

    let try_ui = http::secure_serve_ui(&our, "chat-ui", vec!["/"]);
    http::secure_bind_ws_path("/", true).unwrap();

    match try_ui {
        Ok(()) => {}
        Err(e) => {
            println!("chat.wasm error starting ui: {:?}", e);
        }
    };

    loop {
        match provider_handle_message(&our, &mut state) {
            Ok(()) => {}
            Err(e) => {
                println!("chat.wasm error handling message: {:?}", e);
            }
        };
    }
}