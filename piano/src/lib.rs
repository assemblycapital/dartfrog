use common::{get_server_address, handle_plugin_update, send_to_frontend, update_subscribers, DefaultPluginClientState, PluginClientState, PluginMessage, PluginMetadata, PluginServiceState, PluginState};
use kinode_process_lib::{await_message, call_init, println, Address};
use serde::{Deserialize, Serialize};

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});


#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PianoUpdate {
    PlayNote(String, String), // from, note
}

#[derive(Debug, Clone, Deserialize)]
pub enum PianoRequest {
    PlayNote(String), // note
}

#[derive(Debug, Clone)]
pub struct PianoService {
    pub todo: String,
}

pub fn new_piano_service() -> PianoService {
    PianoService {
        todo: String::new(),
    }
}

#[derive(Debug, Clone)]
pub struct AppState {
    pub plugin: PluginState<PianoService, DefaultPluginClientState>,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            plugin: PluginState::<PianoService, DefaultPluginClientState>::new(),
        }
    }
}

impl PluginServiceState for PianoService {

    fn new() -> Self {
        PianoService {
            todo: String::new(),
        }
    }
    fn handle_unsubscribe(&mut self, _subscriber_node: String, _our: &Address, _metadata: &PluginMetadata) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_subscribe(&mut self, _subscriber_node: String, _our: &Address, _metadata: &PluginMetadata) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: String, our: &Address, metadata: &PluginMetadata) -> anyhow::Result<()> {

        // println!("piano service received request: {:?}", req);
        let Ok(request) = serde_json::from_str::<PianoRequest>(&req) else {
            println!("error parsing request: {:?}", req);
            return Ok(());
        };
        match request {
            PianoRequest::PlayNote(note) => {
                let chat_upd = PianoUpdate::PlayNote(from, note);
                // println!("chat service sending update to subscribers");
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

    if source != &get_server_address(our.node()) {
        println!("piano received message from unknown source: {:?}", source);
        return Ok(());
    }

    if !message.is_request() {
        return Err(anyhow::anyhow!("unexpected Response: {:?}", message));
    }
    
    if let Ok(plugin_message) = serde_json::from_slice::<PluginMessage>(&body) {
        if let Err(e) = handle_plugin_update(plugin_message, &mut state.plugin, our, source) {
            println!("piano error handling plugin update: {:?}", e);
        }
    }
    Ok(())
}

call_init!(init);
fn init(our: Address) {
    println!("init piano");
    let mut state: AppState = AppState::new();

    let try_ui = kinode_process_lib::http::serve_ui(&our, "piano-ui", true, false, vec!["/"]);
    match try_ui {
        Ok(()) => {}
        Err(e) => {
            println!("piano error starting ui: {:?}", e)
        }
    };

    loop {
        match handle_message(&our, &mut state) {
            Ok(()) => {}
            Err(e) => {
                println!("piano error handling message: {:?}", e)
            }
        };
    }
}
