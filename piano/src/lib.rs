use dartfrog_lib::*;
use hyperware_process_lib::{call_init, println, http::server, Address};
use serde::{Serialize, Deserialize};

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v1",
});

type AppProviderState = ProviderState<AppService, DefaultAppClientState, DefaultAppProcessState>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppService {
    pub piano: PianoServiceState,
    pub chat: ChatServiceState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppUpdate {
    Piano(PianoUpdate),
    Chat(ChatUpdate),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppRequest {
    Piano(PianoRequest),
    Chat(ChatRequest),
}

#[derive(Debug, Clone)]
pub struct AppState {
    pub provider: AppProviderState,
}

impl AppState {
    pub fn new(our: &Address) -> Self {
        AppState {
            provider: AppProviderState::new(our),
        }
    }
}

impl AppServiceState for AppService {
    fn new() -> Self {
        AppService {
            chat: ChatServiceState::new(),
            piano: PianoServiceState::new()
        }
    }

    fn init(&mut self, our: &Address, service: &Service) -> anyhow::Result<()> {
        default_load_service::<Self>(our, &service.id.to_string(), self)
    }

    fn save(&mut self, our: &Address, service: &Service) -> anyhow::Result<()> {
        default_save_service::<Self>(our, &service.id.to_string(), self)
    }

    fn handle_subscribe(&mut self, subscriber_node: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        self.piano.handle_subscribe(subscriber_node.clone(), our, service)?;
        self.chat.handle_subscribe(subscriber_node, our, service)?;
        self.save(our, service)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        let request = serde_json::from_str::<AppRequest>(&req)?;
        match request {
            AppRequest::Piano(piano_request) => {
                self.piano.handle_request(from, piano_request, our, service)?;
            }
            AppRequest::Chat(chat_request) => {
                self.chat.handle_request(from, chat_request, our, service)?;
            }
        }
        self.save(our, service)?;
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PianoUpdate {
    PlayNote { from: String, note: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PianoRequest {
    PlayNote(String), // note
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PianoServiceState {
    // You can add any state you need here
}

impl PianoServiceState {
    fn new() -> Self {
        PianoServiceState {}
    }

    fn handle_subscribe(&mut self, _subscriber_node: String, _our: &Address, _service: &Service) -> anyhow::Result<()> {
        // If you need to send any initial state, you can do it here
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: PianoRequest, our: &Address, service: &Service) -> anyhow::Result<()> {
        match req {
            PianoRequest::PlayNote(note) => {
                let upd = PianoUpdate::PlayNote { from, note };
                update_subscribers(AppUpdate::Piano(upd), our, service)?;
            }
        }
        Ok(())
    }
}

call_init!(init);
fn init(our: Address) {
    let mut state = AppState::new(&our);
    let loaded_provider = AppProviderState::load(&our);
    state.provider = loaded_provider;

    // Create HTTP server instance
    let mut http_server = server::HttpServer::new(5);
    let http_config = server::HttpBindingConfig::default()
        .secure_subdomain(true);

    // Serve UI files
    http_server
        .serve_ui(&our, "piano-ui", vec!["/", "*"], http_config.clone())
        .expect("failed to serve ui");

    // Bind websocket path with secure subdomain
    let ws_config = server::WsBindingConfig::default()
        .secure_subdomain(true);
    http_server
        .bind_ws_path("/", ws_config)
        .expect("failed to bind ws");

    loop {
        match provider_handle_message(&our, &mut state.provider) {
            Ok(()) => {
            }
            Err(e) => {
                println!("piano error handling message: {:?}", e);
            }
        };
    }
}