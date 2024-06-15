use common::{handle_message, update_client, update_subscribers, PluginMetadata, PluginState};
use kinode_process_lib::{call_init, println, Address};
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
    ResetGame,
}

#[derive(Debug, Clone, Serialize)]
pub enum ChessUpdate {
    ChessState(ChessState),
}

#[derive(Debug, Clone, Serialize)]
pub struct ChessGame {
    white: String,
    black: String,
    is_white_turn: bool,
    moves: Vec<String>,
}

fn new_game(white:String, black:String) -> ChessGame {
    ChessGame {
        white: white.to_string(),
        black: black.to_string(),
        is_white_turn: true,
        moves: vec![],
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct ChessState {
    queued_white: Option<String>,
    queued_black: Option<String>,
    game: Option<ChessGame>,
}

impl PluginState for ChessState {
    fn new() -> Self {
        ChessState {
            queued_white: None,
            queued_black: None,
            game: None,
        }
    }

    fn handle_exit(&mut self, _from: String, _meta: &PluginMetadata, _our: &Address) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_join(&mut self, from: String, meta: &PluginMetadata, our: &Address) -> anyhow::Result<()> {
        let state_update = ChessUpdate::ChessState(self.clone());
        update_client(our, from, state_update, meta)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: String, meta: &PluginMetadata, our: &Address) -> anyhow::Result<()> {
        let request: ChessRequest = serde_json::from_str(&req).unwrap_or_else(|_| {
            println!("Error parsing request: {:?}", req);
            return ChessRequest::ResetGame; // Default fallback action
        });

        match request {
            ChessRequest::Queue(color) => {
                match color {
                    ChessColor::White => {
                        // Only set the queue if it is currently None
                        if self.queued_white.is_none() {
                            self.queued_white = Some(from.clone());
                        }
                    },
                    ChessColor::Black => {
                        // Only set the queue if it is currently None
                        if self.queued_black.is_none() {
                            self.queued_black = Some(from.clone());
                        }
                    },
                }

                if self.queued_white.is_some() && self.queued_black.is_some() {
                    // Start game if both players are queued
                    self.game = Some(new_game(self.queued_white.clone().unwrap(), self.queued_black.clone().unwrap()));
                    self.queued_black = None;
                    self.queued_white = None;
                }
            }
            ChessRequest::UnQueue(color) => {
                match color {
                    ChessColor::White => if self.queued_white == Some(from.clone()) { self.queued_white = None },
                    ChessColor::Black => if self.queued_black == Some(from.clone()) { self.queued_black = None },
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
            }
            ChessRequest::ResetGame => {
                self.game = None;
            }
        }

        let state_update = ChessUpdate::ChessState(self.clone());
        update_subscribers(our, state_update, meta)?;
        Ok(())
    }
}

call_init!(init);
fn init(our: Address) {
    let mut meta: Option<PluginMetadata> = None;
    let mut state: ChessState = ChessState::new();
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
