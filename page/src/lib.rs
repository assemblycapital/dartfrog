use dartfrog_lib::*;
use hyperware_process_lib::{call_init, http::server, Address};
use serde::{Serialize, Deserialize};
use constants::DEFAULT_PAGE;

mod constants;

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v1",
});

type AppProviderState = ProviderState<AppService, DefaultAppClientState, DefaultAppProcessState>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppService {
    pub page: PageServiceState,
    pub chat: ChatServiceState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppUpdate {
    Page(PageUpdate),
    Chat(ChatUpdate),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppRequest {
    Page(PageRequest),
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
            page: PageServiceState::new()
        }
    }
    fn init(&mut self, our: &Address, service: &Service) -> anyhow::Result<()> {
        default_load_service::<Self>(our, &service.id.to_string(), self)
    }

    fn save(&mut self, our: &Address, service: &Service) -> anyhow::Result<()> {
        default_save_service::<Self>(our, &service.id.to_string(), self)
    }

    fn handle_subscribe(&mut self, subscriber_node: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        self.page.handle_subscribe(subscriber_node.clone(), our, service)?;
        self.chat.handle_subscribe(subscriber_node, our, service)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        let request = serde_json::from_str::<AppRequest>(&req)?;
        match request {
            AppRequest::Page(page_request) => {
                self.page.handle_request(from, page_request, our, service)
            }
            AppRequest::Chat(chat_request) => {
                self.chat.handle_request(from, chat_request, our, service)
            }
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PageUpdate {
    Page(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PageRequest {
    EditPage(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageServiceState {
    pub page: String,
}

impl PageServiceState {
    fn new() -> Self {
        PageServiceState {
            page: DEFAULT_PAGE.to_string(),
        }
    }

    fn handle_subscribe(&mut self, _subscriber_node: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        let upd = PageUpdate::Page(self.page.clone());
        update_subscribers(AppUpdate::Page(upd), our, service)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: PageRequest, our: &Address, service: &Service) -> anyhow::Result<()> {
        if from != our.node() {
            return Ok(());
        }
        match req {
            PageRequest::EditPage(new_page) => {
                self.page = new_page.clone();
                let upd = PageUpdate::Page(new_page);
                update_subscribers(AppUpdate::Page(upd), our, service)?;
            }
        }
        Ok(())
    }
}

call_init!(init);
fn init(our: Address) {
    println!("init page");
    let mut state = AppState::new(&our);
    let loaded_provider = AppProviderState::load(&our);
    state.provider = loaded_provider;

    // Create HTTP server instance
    let mut http_server = server::HttpServer::new(5);
    let http_config = server::HttpBindingConfig::default()
        .secure_subdomain(true);

    // Serve UI files
    http_server
        .serve_ui("page-ui", vec!["/", "*"], http_config.clone())
        .expect("failed to serve ui");

    // Bind websocket path with secure subdomain
    let ws_config = server::WsBindingConfig::default()
        .secure_subdomain(true);
}