use dartfrog_lib::*;
use hyperware_process_lib::{call_init, http, Address};
use serde::{Serialize, Deserialize};
use hyperware_process_lib::http::server;

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v1",
});

type AppProviderState = ProviderState<AppService, DefaultAppClientState, DefaultAppProcessState>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppService {
    pub chess: ChessServiceState,
    pub chat: ChatServiceState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppUpdate {
    Chess(ChessUpdate),
    Chat(ChatUpdate),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppRequest {
    Chess(ChessRequest),
    Chat(ChatRequest),
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
            chess: ChessServiceState::new(),
            chat: ChatServiceState::new(),
        }
    }

    fn init(&mut self, our: &Address, service: &Service) -> anyhow::Result<()> {
        default_load_service::<Self>(our, &service.id.to_string(), self)
    }

    fn save(&mut self, our: &Address, service: &Service) -> anyhow::Result<()> {
        default_save_service::<Self>(our, &service.id.to_string(), self)
    }

    fn handle_subscribe(&mut self, subscriber_node: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        self.chess.handle_subscribe(subscriber_node.clone(), our, service)?;
        self.chat.handle_subscribe(subscriber_node, our, service)?;
        self.save(our, service)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        let request = serde_json::from_str::<AppRequest>(&req)?;
        match request {
            AppRequest::Chess(chess_request) => {
                self.chess.handle_request(from, chess_request, our, service)?;
            }
            AppRequest::Chat(chat_request) => {
                self.chat.handle_request(from, chat_request, our, service)?;
            }
        }
        self.save(our, service)?;
        Ok(())
    }
}

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
    ChessState(ChessServiceState),
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
pub struct ChessServiceState {
    queued_white: Option<String>,
    queued_black: Option<String>,
    game: Option<ChessGame>,
}

impl ChessServiceState {
    fn new() -> Self {
        ChessServiceState {
            queued_white: None,
            queued_black: None,
            game: None,
        }
    }

    fn handle_unsubscribe(&mut self, _subscriber_node: String, _our: &Address, _service: &Service) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_subscribe(&mut self, _subscriber_node: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        let update = ChessUpdate::ChessState(self.clone());
        update_subscribers(AppUpdate::Chess(update), our, service)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: ChessRequest, our: &Address, service: &Service) -> anyhow::Result<()> {
        match req {
            ChessRequest::Queue(color) => {
                match color {
                    ChessColor::White => {
                        if self.queued_white.is_none() {
                            self.queued_white = Some(from.clone());
                            let update = ChessUpdate::ChessState(self.clone());
                            update_subscribers(AppUpdate::Chess(update), our, service)?;
                        }
                    },
                    ChessColor::Black => {
                        if self.queued_black.is_none() {
                            self.queued_black = Some(from.clone());
                            let update = ChessUpdate::ChessState(self.clone());
                            update_subscribers(AppUpdate::Chess(update), our, service)?;
                        }
                    },
                }

                if self.queued_white.is_some() && self.queued_black.is_some() {
                    self.game = Some(new_game(self.queued_white.clone().unwrap(), self.queued_black.clone().unwrap()));
                    self.queued_black = None;
                    self.queued_white = None;

                    let update = ChessUpdate::GameStart;
                    update_subscribers(AppUpdate::Chess(update), our, service)?;
                }
                let state_update = ChessUpdate::ChessState(self.clone());
                update_subscribers(AppUpdate::Chess(state_update), our, service)?;
            }
            ChessRequest::UnQueue(color) => {
                match color {
                    ChessColor::White => if self.queued_white == Some(from.clone()) {
                        self.queued_white = None;
                        let state_update = ChessUpdate::ChessState(self.clone());
                        update_subscribers(AppUpdate::Chess(state_update), our, service)?;
                    },
                    ChessColor::Black => if self.queued_black == Some(from.clone()) {
                        self.queued_black = None;
                        let state_update = ChessUpdate::ChessState(self.clone());
                        update_subscribers(AppUpdate::Chess(state_update), our, service)?;
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
                update_subscribers(AppUpdate::Chess(state_update), our, service)?;
            }
            ChessRequest::Reset => {
                if from == our.node() {
                    self.game = None;
                    self.queued_white = None;
                    self.queued_black = None;
                }
                let state_update = ChessUpdate::ChessState(self.clone());
                update_subscribers(AppUpdate::Chess(state_update), our, service)?;
            }
        }

        Ok(())
    }
}

call_init!(init);
fn init(our: Address) {
    println!("init chess");
    let mut state = AppState::new(&our);
    let loaded_provider = AppProviderState::load(&our);
    state.provider = loaded_provider;

    // Create HTTP server instance
    let mut http_server = server::HttpServer::new(5);
    let http_config = server::HttpBindingConfig::default()
        .secure_subdomain(true);

    // Serve UI files
    http_server
        .serve_ui(&our, "chess-ui", vec!["/", "*"], http_config.clone())
        .expect("failed to serve ui");

    // Bind websocket path
    let ws_config = server::WsBindingConfig::default()
        .secure_subdomain(true);
    http_server
        .bind_ws_path("/", ws_config)
        .expect("failed to bind ws");

    loop {
        match provider_handle_message(&our, &mut state.provider) {
            Ok(()) => {}
            Err(e) => {
                println!("chess service error handling message: {:?}", e);
            }
        };
    }
}