use common::{get_server_address, handle_plugin_update, send_to_frontend, update_subscriber_clients, PluginClientState, PluginMessage, PluginMetadata, PluginServiceState, PluginState};
use kinode_process_lib::{await_message, call_init, println, Address};
use serde::{Deserialize, Serialize};

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChessColor {
    Black,
    White,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChessRequest {
    Queue(ChessColor),
    UnQueue(ChessColor),
    Move(String),
    Reset,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChessUpdate {
    ChessState(ChessService),
    GameStart, // just an event for sfx
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChessGame {
    white: String,
    black: String,
    is_white_turn: bool,
    moves: Vec<String>,
}

fn new_game(white: String, black: String) -> ChessGame {
    ChessGame {
        white,
        black,
        is_white_turn: true,
        moves: vec![],
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChessService {
    queued_white: Option<String>,
    queued_black: Option<String>,
    game: Option<ChessGame>,
}

impl PluginServiceState for ChessService {
    fn new() -> Self {
        ChessService {
            queued_white: None,
            queued_black: None,
            game: None,
        }
    }

    fn handle_unsubscribe(&mut self, _subscriber_node: String, _our: &Address, _metadata: &PluginMetadata) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_subscribe(&mut self, _subscriber_node: String, our: &Address, metadata: &PluginMetadata) -> anyhow::Result<()> {
        let update = ChessUpdate::ChessState(self.clone());
        update_subscriber_clients(our, update, metadata)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: String, our: &Address, metadata: &PluginMetadata) -> anyhow::Result<()> {
        let request: Result<ChessRequest, _> = serde_json::from_str(&req);
        if request.is_err() {
            println!("Error parsing request: {:?}", req);
            return Ok(()); // Ignore the request
        }

        let request = request.unwrap();

        match request {
            ChessRequest::Queue(color) => {
                match color {
                    ChessColor::White => {
                        if self.queued_white.is_none() {
                            self.queued_white = Some(from.clone());
                            let update = ChessUpdate::ChessState(self.clone());
                            update_subscriber_clients(our, update, metadata)?;
                        }
                    },
                    ChessColor::Black => {
                        if self.queued_black.is_none() {
                            self.queued_black = Some(from.clone());
                            let update = ChessUpdate::ChessState(self.clone());
                            update_subscriber_clients(our, update, metadata)?;
                        }
                    },
                }

                if self.queued_white.is_some() && self.queued_black.is_some() {
                    self.game = Some(new_game(self.queued_white.clone().unwrap(), self.queued_black.clone().unwrap()));
                    self.queued_black = None;
                    self.queued_white = None;

                    let update = ChessUpdate::GameStart;
                    update_subscriber_clients(our, update, metadata)?;
                }
                let state_update = ChessUpdate::ChessState(self.clone());
                update_subscriber_clients(our, state_update, metadata)?;
            }
            ChessRequest::UnQueue(color) => {
                match color {
                    ChessColor::White => if self.queued_white == Some(from.clone()) {
                        self.queued_white = None;
                        let state_update = ChessUpdate::ChessState(self.clone());
                        update_subscriber_clients(our, state_update, metadata)?;
                    },
                    ChessColor::Black => if self.queued_black == Some(from.clone()) {
                        self.queued_black = None;
                        let state_update = ChessUpdate::ChessState(self.clone());
                        update_subscriber_clients(our, state_update, metadata)?;
                    },
                }
            }
            ChessRequest::Move(move_string) => {
                if let Some(game) = &mut self.game {
                    if game.is_white_turn && from != game.white {
                        return Ok(());
                    }
                    if !game.is_white_turn && from != game.black {
                        return Ok(());
                    }
                    game.moves.push(move_string);
                    game.is_white_turn = !game.is_white_turn;
                }
                let state_update = ChessUpdate::ChessState(self.clone());
                update_subscriber_clients(our, state_update, metadata)?;
            }
            ChessRequest::Reset => {
                if from == our.node() {
                    self.game = None;
                    self.queued_white = None;
                    self.queued_black = None;
                }
                let state_update = ChessUpdate::ChessState(self.clone());
                update_subscriber_clients(our, state_update, metadata)?;
            }
        }

        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct ChessClient {
    service: Option<ChessService>,
}

impl PluginClientState for ChessClient {
    fn new() -> Self {
        ChessClient {
            service: None,
        }
    }

    fn handle_new_frontend(&mut self, our: &Address, metadata: &PluginMetadata) -> anyhow::Result<()> {
        // Assuming we have a similar update structure for chess
        match &self.service {
            Some(service) => {
                let upd = ChessUpdate::ChessState(service.clone()); // Assuming `self.game` holds the current game state
                let upd_str = serde_json::to_string(&upd).map_err(|e| {
                    println!("error serializing update: {:?}", e);
                    e
                })?;
                send_to_frontend(&upd_str, metadata, our)?;
            }
            None => {
                println!("chess service not initialized");
            }
        }
        Ok(())
    }

    fn   handle_frontend_message(&mut self, _update: String, _our: &Address, _metadata: &PluginMetadata) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_service_message(&mut self, update: String, our: &Address, metadata: &PluginMetadata) -> anyhow::Result<()> {
        // Assuming updates are serialized `ChessUpdate`
        let upd = serde_json::from_str::<ChessUpdate>(&update).map_err(|e| {
            println!("error parsing update: {:?}", update);
            e
        })?;

        match upd {
            ChessUpdate::ChessState(new_state) => {
                // Assuming `self.game` holds the current game state
                self.service = Some(new_state);
                send_to_frontend(&update, metadata, our)?;
            }
            ChessUpdate::GameStart => {
                send_to_frontend(&update, metadata, our)?;
            }
        }
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct AppState {
    pub plugin: PluginState<ChessService, ChessClient>,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            plugin: PluginState::<ChessService, ChessClient>::new(),
        }
    }
}


fn handle_message(our: &Address, state: &mut AppState) -> anyhow::Result<()> {
    let message = await_message()?;

    let body = message.body();
    let source = message.source();

    if source != &get_server_address(our.node()) {
        println!("chess received message from unknown source: {:?}", source);
        return Ok(());
    }

    if !message.is_request() {
        return Err(anyhow::anyhow!("unexpected Response: {:?}", message));
    }
    
    if let Ok(plugin_message) = serde_json::from_slice::<PluginMessage>(&body) {
        if let Err(e) = handle_plugin_update(plugin_message, &mut state.plugin, our) {
            println!("chess error handling plugin update: {:?}", e);
        }
    }
    Ok(())
}


call_init!(init);
fn init(our: Address) {
    println!("init chess");
    let mut state: AppState = AppState::new();

    let try_ui = kinode_process_lib::http::serve_ui(&our, "chess-ui", true, false, vec!["/"]);
    match try_ui {
        Ok(()) => {}
        Err(e) => {
            println!("chess error starting ui: {:?}", e)
        }
    };

    loop {
        match handle_message(&our, &mut state) {
            Ok(()) => {}
            Err(e) => {
                println!("chess service error handling message: {:?}", e)
            }
        };
    }
}
