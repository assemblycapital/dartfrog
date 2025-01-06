use dartfrog_lib::*;
use kinode_process_lib::{call_init, http::server, Address};
use serde::{Serialize, Deserialize};

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v1",
});

type AppProviderState = ProviderState<AppService, DefaultAppClientState, DefaultAppProcessState>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppService {
    pub chat: ChatServiceState,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppUpdate {
    Chat(ChatUpdate),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppRequest {
    Chat(ChatRequest),
}

#[derive(Debug, Clone)]
pub struct AppState {
    pub provider: AppProviderState,
}

impl AppState {
    pub fn new(our:&Address) -> Self {
        AppState {
            provider: AppProviderState::new(our),
        }
    }
}

impl AppServiceState for AppService {
    fn new() -> Self {
        AppService {
            chat: ChatServiceState::new()
        }
    }

    fn init(&mut self, our: &Address, service: &Service) -> anyhow::Result<()> {
        default_load_service::<Self>(our, &service.id.to_string(), self)
    }

    fn save(&mut self, our: &Address, service: &Service) -> anyhow::Result<()> {
        default_save_service::<Self>(our, &service.id.to_string(), self)
    }

    fn handle_subscribe(&mut self, subscriber_node: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        self.chat.handle_subscribe(subscriber_node, our, service)?;
        self.save(our, service)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        let request = serde_json::from_str::<AppRequest>(&req)?;
        match request {
            AppRequest::Chat(chat_request) => {
                self.chat.handle_request(from, chat_request, our, service);
            }
        }
        self.save(our, service)?;
        Ok(())
    }
}

call_init!(init);
fn init(our: Address) {
    println!("init chat");
    let mut state = AppState::new(&our);
    let loaded_provider = AppProviderState::load(&our);
    state.provider = loaded_provider;

    // Create HTTP server instance
    let mut http_server = server::HttpServer::new(5);
    let http_config = server::HttpBindingConfig::default()
        .secure_subdomain(true);

    // Serve UI files
    http_server
        .serve_ui(&our, "chat-ui", vec!["/", "*"], http_config.clone())
        .expect("failed to serve ui");

    // Bind websocket path with secure subdomain config
    let ws_config = server::WsBindingConfig::default()
        .secure_subdomain(true);
    http_server
        .bind_ws_path("/", ws_config)
        .expect("failed to bind ws");

    loop {
        match provider_handle_message(&our, &mut state.provider) {
            Ok(()) => {}
            Err(e) => {
                println!("chat error handling message: {:?}", e);
            }
        };
    }
}