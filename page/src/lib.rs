use common::{get_server_address, handle_plugin_update, send_to_frontend, update_subscriber_clients, PluginClientState, PluginMessage, PluginMetadata, PluginServiceState, PluginState};
use constants::DEFAULT_PAGE;
use kinode_process_lib::{await_message, call_init, println, Address};
use serde::{Deserialize, Serialize};

mod constants;

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});


#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PageUpdate {
    Page(String),
}

#[derive(Debug, Clone, Deserialize)]
pub enum PageRequest {
    EditPage(String),
}

#[derive(Debug, Clone)]
pub struct PageService {
    pub page: String,
}

#[derive(Debug, Clone)]
pub struct PageClient {
    pub page: String,
}

pub fn new_page_service() -> PageService {
    PageService {
        page: String::new(),
    }
}

#[derive(Debug, Clone)]
pub struct AppState {
    pub plugin: PluginState<PageService, PageClient>,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            plugin: PluginState::<PageService, PageClient>::new(),
        }
    }
}

impl PluginClientState for PageClient {
    fn new() -> Self {
        PageClient {
            page: String::new(),
        }
    }
    fn handle_new_frontend(&mut self, our: &Address, metadata: &PluginMetadata) -> anyhow::Result<()> {
        let upd = PageUpdate::Page(self.page.clone());
        let Ok(upd_str) = serde_json::to_string(&upd) else {
            println!("error serializing update: {:?}", upd);
            return Ok(());
        };
        send_to_frontend(&upd_str, metadata, our)?;
        Ok(())
    }
    fn handle_frontend_message(&mut self, _update: String, _our: &Address, _metadata: &PluginMetadata) -> anyhow::Result<()> {
        Ok(())
    }
    fn handle_service_message(&mut self, update: String, our: &Address, metadata: &PluginMetadata) -> anyhow::Result<()> {
        // TODO cache page
        let Ok(upd) = serde_json::from_str::<PageUpdate>(&update) else {
            println!("error parsing request: {:?}", update);
            return Ok(());
        };
        match upd {
            PageUpdate::Page(new_page) => {
                self.page = new_page.clone();
            }
        }
        send_to_frontend(&update, metadata, our)?;
        Ok(())
    }
}
impl PluginServiceState for PageService {

    fn new() -> Self {
        PageService {
            page: DEFAULT_PAGE.to_string(),
        }
    }
    fn handle_unsubscribe(&mut self, _subscriber_node: String, _our: &Address, _metadata: &PluginMetadata) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_subscribe(&mut self, _subscriber_node: String, our: &Address, metadata: &PluginMetadata) -> anyhow::Result<()> {
        let upd = PageUpdate::Page(self.page.clone());
        match update_subscriber_clients(our, upd, metadata) {
            Ok(()) => {}
            Err(e) => {
                println!("error sending update to subscribers: {:?}", e);
            }
        }
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: String, our: &Address, metadata: &PluginMetadata) -> anyhow::Result<()> {

        if from != our.node() {
            return Ok(());
        }
        // println!("page service received request: {:?}", req);
        let Ok(request) = serde_json::from_str::<PageRequest>(&req) else {
            println!("error parsing request: {:?}", req);
            return Ok(());
        };
        match request {
            PageRequest::EditPage(new_page) => {
                self.page = new_page.clone();
                let upd = PageUpdate::Page(new_page);

                match update_subscriber_clients(our, upd, metadata) {
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

    if source != &get_server_address(our.node()) {
        println!("page received message from unknown source: {:?}", source);
        return Ok(());
    }

    if !message.is_request() {
        return Err(anyhow::anyhow!("unexpected Response: {:?}", message));
    }
    
    if let Ok(plugin_message) = serde_json::from_slice::<PluginMessage>(&body) {
        if let Err(e) = handle_plugin_update(plugin_message, &mut state.plugin, our) {
            println!("page error handling plugin update: {:?}", e);
        }
    }
    Ok(())
}

call_init!(init);
fn init(our: Address) {
    println!("init page");
    let mut state: AppState = AppState::new();

    let try_ui = kinode_process_lib::http::serve_ui(&our, "page-ui", true, false, vec!["/"]);
    match try_ui {
        Ok(()) => {}
        Err(e) => {
            println!("page error starting ui: {:?}", e)
        }
    };

    loop {
        match handle_message(&our, &mut state) {
            Ok(()) => {}
            Err(e) => {
                println!("page error handling message: {:?}", e)
            }
        };
    }
}
