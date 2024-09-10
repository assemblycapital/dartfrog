use std::collections::HashSet;

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
        self.save(our, service)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: String, our: &Address, service: &Service) -> anyhow::Result<()> {
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
    BannedUsers(Vec<String>),
    DeletedRumor(u64),
    RumorAuthor {
        rumor_id: u64,
        author: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RumorsRequest {
    CreateNewRumor(String),
    BanUser { user: String },
    UnbanUser { user: String },
    DeleteRumor { rumor_id: u64 },
    GetRumorAuthor { rumor_id: u64 },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rumor {
    id: u64,
    source: Option<String>,
    time: u64,
    text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RumorsServiceState {
    pub rumors: Vec<Rumor>,
    pub banned_users: HashSet<String>,
    pub next_rumor_id: u64,
}

impl RumorsServiceState {
    fn new() -> Self {
        RumorsServiceState {
            rumors: vec!(),
            banned_users: HashSet::new(),
            next_rumor_id: 1,
        }
    }

    fn handle_subscribe(&mut self, subscriber_node: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        let rumors: Vec<Rumor> = if subscriber_node == our.node {
            // Send full rumors (including source) to the current node
            self.rumors.iter().rev().take(64).cloned().collect()
        } else {
            // Send anonymized rumors to other subscribers
            self.rumors.iter()
                .rev()
                .take(64)
                .map(|rumor| Rumor {
                    id: rumor.id,
                    source: None,
                    text: rumor.text.clone(),
                    time: rumor.time,
                })
                .collect()
        };
        
        let upd = RumorsUpdate::Rumors(rumors);
        update_subscriber(AppUpdate::Rumors(upd), &subscriber_node, our, service)?;
        let banned_upd = RumorsUpdate::BannedUsers(self.banned_users.iter().cloned().collect());
        update_subscriber(AppUpdate::Rumors(banned_upd), &subscriber_node, our, service)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: RumorsRequest, our: &Address, service: &Service) -> anyhow::Result<()> {
        match req {
            RumorsRequest::CreateNewRumor(text) => {
                if !self.banned_users.contains(&from) {
                    let new_rumor = Rumor {
                        id: self.next_rumor_id,
                        source: Some(from),
                        text: text.chars().take(2000).collect(),
                        time: get_now(),
                    };
                    self.rumors.push(new_rumor.clone());
                    self.next_rumor_id += 1;
                    
                    // Create an anonymized version of the rumor for the update
                    let anonymized_rumor = Rumor {
                        id: new_rumor.id,
                        source: None,
                        text: new_rumor.text,
                        time: new_rumor.time,
                    };
                    
                    let upd = RumorsUpdate::NewRumor(anonymized_rumor);
                    update_subscribers(AppUpdate::Rumors(upd), our, service)?;
                }
            }
            RumorsRequest::BanUser { user } => {
                if from == our.node {
                    self.banned_users.insert(user);
                    self.send_banned_users_update(our, service)?;
                }
            }
            RumorsRequest::UnbanUser { user } => {
                if from == our.node {
                    self.banned_users.remove(&user);
                    self.send_banned_users_update(our, service)?;
                }
            }
            RumorsRequest::DeleteRumor { rumor_id } => {
                if from == our.node {
                    if let Some(index) = self.rumors.iter().position(|r| r.id == rumor_id) {
                        self.rumors.remove(index);
                        let delete_update = RumorsUpdate::DeletedRumor(rumor_id);
                        update_subscribers(AppUpdate::Rumors(delete_update), our, service)?;
                    }
                }
            }
            RumorsRequest::GetRumorAuthor { rumor_id } => {
                if from == our.node {
                    if let Some(rumor) = self.rumors.iter().find(|r| r.id == rumor_id) {
                        if let Some(author) = &rumor.source {
                            let author_update = RumorsUpdate::RumorAuthor {
                                rumor_id,
                                author: author.clone(),
                            };
                            update_subscriber(AppUpdate::Rumors(author_update), &from, our, service)?;
                        }
                    }
                }
            }
        }
        Ok(())
    }

    fn send_banned_users_update(&self, our: &Address, service: &Service) -> anyhow::Result<()> {
        let banned_users_update = RumorsUpdate::BannedUsers(self.banned_users.iter().cloned().collect());
        update_subscribers(AppUpdate::Rumors(banned_users_update), our, service)
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