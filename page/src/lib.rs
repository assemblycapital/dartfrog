use common::{handle_message, update_client, update_subscribers, PluginMetadata, PluginState};
use constants::default_html;
use kinode_process_lib::{call_init, println, Address};
use serde::{Deserialize, Serialize};

mod constants;
wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PageRequest{
    Write(String),
}

#[derive(Debug, Clone, Serialize)]
pub enum PageUpdate {
    PageState(String),
}

#[derive(Debug, Clone)]
pub struct PageState {
    page: String,
}

impl PluginState for PageState {
    fn new() -> Self {
        PageState {
            page: default_html.to_string(),
        }
    }

    fn handle_exit(&mut self, _from: String, _meta: &PluginMetadata, _our: &Address) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_join(&mut self, from: String, meta: &PluginMetadata, our: &Address) -> anyhow::Result<()> {
        let state_update = PageUpdate::PageState(self.page.clone());
        update_client(our, from, state_update, meta)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: String, meta: &PluginMetadata, our: &Address) -> anyhow::Result<()> {
        // println!("Page plugin received request: {:?}", req);
        if from != our.node() {
            return Ok(());
        }
        let Ok(request) = serde_json::from_str::<PageRequest>(&req) else {
            println!("error parsing request: {:?}", req);
            return Ok(());
        };
        match request {
            PageRequest::Write(page) => {
                self.page = page;
                let state_update = PageUpdate::PageState(self.page.clone());
                update_subscribers(our, state_update, meta)?;
            }
        }

        Ok(())
    }
}

call_init!(init);
fn init(our: Address) {
    // println!("Page plugin started");
    let mut meta: Option<PluginMetadata> = None;
    let mut state: PageState = PageState::new();
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
