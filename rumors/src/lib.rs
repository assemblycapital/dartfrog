use dartfrog_lib::*;
use kinode_process_lib::{call_init, http, Address, println};
use serde::{Serialize, Deserialize};
wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});

type AppProviderState = ProviderState<AppService, DefaultAppClientState, DefaultAppProcessState>;


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppService {
    pub rumors: RumorsServiceState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppUpdate {
    Rumors(RumorsUpdate),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppRequest {
    Rumors(RumorsRequest),
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
            rumors: RumorsServiceState::new()
        }
    }
    fn init(&mut self, our: &Address, service: &Service) -> anyhow::Result<()> {
        default_load_service::<Self>(our, &service.id.to_string(), self)
    }

    fn save(&mut self, our: &Address, service: &Service) -> anyhow::Result<()> {
        default_save_service::<Self>(our, &service.id.to_string(), self)
    }

    fn handle_subscribe(&mut self, subscriber_node: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        self.rumors.handle_subscribe(subscriber_node, our, service)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        println!("got request {:?}", req);
        let request = serde_json::from_str::<AppRequest>(&req)?;
        match request {
            AppRequest::Rumors(rumors_request) => {
                self.rumors.handle_request(from, rumors_request, our, service)
            }
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RumorsUpdate {
    Rumors(Vec<Rumor>),
    NewRumor(Rumor),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RumorsRequest {
    CreateNewRumor(String)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rumor {
    source: Option<String>,
    time: u64,
    text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RumorsServiceState {
    pub rumors: Vec<Rumor>,
}

impl RumorsServiceState {
    fn new() -> Self {
        RumorsServiceState {
            rumors: vec!(),
        }
    }

    fn handle_subscribe(&mut self, _subscriber_node: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        let anonymized_rumors: Vec<Rumor> = self.rumors.iter()
            .rev() // Reverse to get the most recent rumors first
            .take(64) // Take up to 64 rumors
            .map(|rumor| Rumor {
                source: None,
                text: rumor.text.clone(),
                time: rumor.time,
            })
            .collect();
        
        let upd = RumorsUpdate::Rumors(anonymized_rumors);
        update_subscribers(AppUpdate::Rumors(upd), our, service)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: RumorsRequest, our: &Address, service: &Service) -> anyhow::Result<()> {
        println!("got rumors request {:?}", req);
        match req {
            RumorsRequest::CreateNewRumor(text) => {
                let new_rumor = Rumor {
                    source: Some(from),
                    text: text.chars().take(2000).collect(),
                    time: get_now(),
                };
                self.rumors.push(new_rumor.clone());
                
                // Create an anonymized version of the rumor for the update
                let anonymized_rumor = Rumor {
                    source: None,
                    text: new_rumor.text,
                    time: new_rumor.time,
                };
                
                let upd = RumorsUpdate::NewRumor(anonymized_rumor);
                update_subscribers(AppUpdate::Rumors(upd), our, service)?;
            }
        }
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