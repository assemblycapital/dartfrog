use common::{handle_message, update_subscribers, PluginMetadata, PluginState};
use kinode_process_lib::{call_init, println, Address};
use serde::{Deserialize, Serialize};

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PianoRequest {
    PlayNote(String), // note
}

#[derive(Debug, Clone, Serialize)]
pub enum PianoUpdate {
    NotePlayed(String, String) // from, note
}

#[derive(Debug, Clone)]
pub struct PianoState {
    _todo: u64,
}

impl PluginState for PianoState {
    fn new() -> Self {
        PianoState { _todo: 0 }
    }

    fn handle_exit(&mut self, _from: String, _meta: &PluginMetadata, _our: &Address) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_join(&mut self, _from: String, _meta: &PluginMetadata, _our: &Address) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: String, meta: &PluginMetadata, our: &Address) -> anyhow::Result<()> {
        let Ok(request) = serde_json::from_str::<PianoRequest>(&req) else {
            println!("error parsing request: {:?}", req);
            return Ok(());
        };
        match request {
            PianoRequest::PlayNote(note) => {
                let update = PianoUpdate::NotePlayed(from.clone(), note.clone());
                // let update_str = serde_json::to_string(&update).unwrap();
                update_subscribers(our, &update, meta)?;
            }
        }
        Ok(())
    }
}

call_init!(init);
fn init(our: Address) {
    // println!("Piano plugin started");
    let mut meta: Option<PluginMetadata> = None;
    let mut state: PianoState = PianoState::new();
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
