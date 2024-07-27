use dartfrog_lib::*;
use kinode_process_lib::{call_init, http, Address};
use serde::{Serialize, Deserialize};
use constants::DEFAULT_PAGE;

mod constants;

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});

type AppProviderState = ProviderState<AppService, DefaultAppClientState>;

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

    fn handle_unsubscribe(&mut self, _subscriber_node: String, _our: &Address, _service: &Service) -> anyhow::Result<()> {
        Ok(())
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
    println!("init radio");
    let mut state = AppState::new(&our);
    let loaded_provider = AppProviderState::load(&our);
    state.provider = loaded_provider;

    let try_ui = http::secure_serve_ui(&our, "radio-ui", vec!["/", "*"]);
    http::secure_bind_ws_path("/", true).unwrap();

    match try_ui {
        Ok(()) => {}
        Err(e) => {
            println!("radio error starting ui: {:?}", e);
        }
    };

    loop {
        match provider_handle_message(&our, &mut state.provider) {
            Ok(()) => {}
            Err(e) => {
                println!("radio error handling message: {:?}", e);
            }
        };
    }
}