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
    uuid: String,
    text_contents: String,
    time: u64,
    hops: u32,
    heard_from: Option<String>,
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
    CreateNewRumor(String),
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
    fn handle_frontend_message(&mut self, message: String, _our: &Address, consumer: &Consumer) -> Result<()> {
        let parsed_message = serde_json::from_str::<FrontendRequest>(&message)?;
        // Add logic to handle frontend messages here
        // println!("rumors frontend message! {:?}", message);
        match parsed_message {
            FrontendRequest::AddPeers(peers) => {
                // Add new peers to the list, avoiding duplicates
                for peer in peers {
                    if !self.peers.contains(&peer) {
                        self.peers.push(peer);
                    }
                }
                // Notify the frontend about the updated peer list
                let peers_update = RumorsUpdate::Peers(self.peers.clone());
                update_consumer_from_process(consumer, peers_update)?;
            }
            FrontendRequest::RemovePeers(peers) => {
                // Remove specified peers from the list
                self.peers.retain(|p| !peers.contains(p));
                // Notify the frontend about the updated peer list
                let peers_update = RumorsUpdate::Peers(self.peers.clone());
                update_consumer_from_process(consumer, peers_update)?;
            }
            FrontendRequest::CreateNewRumor(text) => {
                println!("create rumor {:?}", text);
                // Create a new RumorPost
                let new_rumor = RumorPost {
                    uuid: generate_uuid_v4(),
                    text_contents: text,
                    time: std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_secs(),
                    hops: 0,
                    heard_from: None,
                    claims_relay: true,
                };
                // Add the new rumor to the list
                self.rumors.push(new_rumor.clone());
                // Notify the frontend about the new rumor
                let rumor_update = RumorsUpdate::NewRumor(new_rumor);
                update_consumer_from_process(consumer, rumor_update)?;
            }
        }
        Ok(())
    }

    fn handle_new_frontend(&mut self, _our: &Address, consumer: &Consumer) -> Result<()> {
        println!("rumors new frontend!");
        
        // Send rumors update
        let rumors_update = RumorsUpdate::Rumors(self.rumors.clone());
        update_consumer_from_process(consumer, rumors_update)?;

        // Send peers update
        let peers_update = RumorsUpdate::Peers(self.peers.clone());
        update_consumer_from_process(consumer, peers_update)?;
        
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