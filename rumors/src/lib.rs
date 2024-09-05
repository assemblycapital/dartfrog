use dartfrog_lib::*;
use kinode_process_lib::{call_init, http, Address, println};
use serde::{Serialize, Deserialize};
use anyhow::Result; 

use std::fmt::Write;
use rand::Rng;

fn generate_uuid_v4() -> String {
    let mut rng = rand::thread_rng();
    let mut bytes = [0u8; 16];
    rng.fill(&mut bytes);

    // Set the version to 4 (randomly generated UUID)
    bytes[6] = (bytes[6] & 0x0F) | 0x40;
    // Set the variant to DCE 1.1
    bytes[8] = (bytes[8] & 0x3F) | 0x80;

    let mut uuid = String::new();
    for (i, byte) in bytes.iter().enumerate() {
        if i == 4 || i == 6 || i == 8 || i == 10 {
            write!(&mut uuid, "-").unwrap();
        }
        write!(&mut uuid, "{:02x}", byte).unwrap();
    }

    uuid
}

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});

type AppProviderState = ProviderState<DefaultAppServiceState, DefaultAppClientState, AppProcess>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RumorPost {
    text_contents: String,
    time: u64,
    source: Option<String>,
    hops: u32,
    claims_relay: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppProcess {
    rumors: Vec<RumorPost>,
    peers: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RumorsUpdate {
    Peers(Vec<String>),
    Rumors(Vec<RumorPost>),
    NewRumor(RumorPost),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RumorsRequest {
    Hop(RumorPost), // send to one peer, decrement hops
    Broadcast(RumorPost), // send to all peers
    Frontend(FrontendRequest),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FrontendRequest {
    AddPeers(Vec<String>),
    RemovePeers(Vec<String>),
    Post(RumorPost),
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

impl AppProcessState for AppProcess {
    fn new() -> Self {
        AppProcess {
            rumors: Vec::new(),
            peers: Vec::new(),
        }
    }

    fn init(&mut self, _our: &Address) -> Result<()> {
        // Add any initialization logic here if needed
        Ok(())
    }

    fn save(&mut self, _our: &Address) -> Result<()> {
        // Add any saving logic here if needed
        Ok(())
    }

    fn handle_message(&mut self, source: &Address, message: String, _our: &Address) -> Result<()> {
        println!("rumors message! {:?} {:?}", source, message);
        // Add logic to handle frontend messages here
        Ok(())
    }
    fn handle_frontend_message(&mut self, message: String, _our: &Address, _consumer: &Consumer) -> Result<()> {
        println!("rumors frontend message! {:?}", message);
        // Add logic to handle frontend messages here
        Ok(())
    }

    fn handle_new_frontend(&mut self, _our: &Address, consumer: &Consumer) -> Result<()> {
        println!("rumors new frontend!");
        
        // Send rumors update
        let rumors_update = RumorsUpdate::Rumors(self.rumors.clone());
        let serialized_rumors = serde_json::to_string(&rumors_update)?;
        let update = FrontendUpdate::Meta(FrontendMetaUpdate::FromProcess(serialized_rumors));
        update_consumer(consumer.ws_channel_id, update)?;

        // Send peers update
        let peers_update = RumorsUpdate::Peers(self.peers.clone());
        let serialized_peers = serde_json::to_string(&peers_update)?;
        let update = FrontendUpdate::Meta(FrontendMetaUpdate::FromProcess(serialized_peers));
        update_consumer(consumer.ws_channel_id, update)?;
        
        Ok(())
    }
}

call_init!(init);
fn init(our: Address) {
    // println!("init rumors");
    let mut state = AppState::new(&our);
    let loaded_provider = AppProviderState::load(&our);
    state.provider = loaded_provider;

    let try_ui = http::secure_serve_ui(&our, "rumors-ui", vec!["/", "*"]);
    http::secure_bind_ws_path("/", true).unwrap();

    match try_ui {
        Ok(()) => {}
        Err(e) => {
            println!("error starting ui: {:?}", e);
        }
    };

    loop {
        match provider_handle_message(&our, &mut state.provider) {
            Ok(()) => {}
            Err(e) => {
                println!("error handling message: {:?}", e);
            }
        };
    }
}