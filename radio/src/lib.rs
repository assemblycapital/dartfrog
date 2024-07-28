use std::collections::HashMap;

use dartfrog_lib::*;
use kinode_process_lib::{call_init, http, Address};
use serde::{Serialize, Deserialize};
use constants::DEFAULT_PAGE;

mod constants;

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});

type AppProviderState = ProviderState<AppService, DefaultAppClientState>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppService {
    pub radio: RadioServiceState,
    pub chat: ChatServiceState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppUpdate {
    Radio(RadioUpdate),
    Chat(ChatUpdate),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppRequest {
    Radio(RadioRequest),
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
            chat: ChatServiceState::new(),
            radio: RadioServiceState::new()
        }
    }

    fn handle_unsubscribe(&mut self, _subscriber_node: String, _our: &Address, _service: &Service) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_subscribe(&mut self, subscriber_node: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        self.radio.handle_subscribe(subscriber_node.clone(), our, service)?;
        self.chat.handle_subscribe(subscriber_node, our, service)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        let request = serde_json::from_str::<AppRequest>(&req)?;
        match request {
            AppRequest::Radio(radio_request) => {
                self.radio.handle_request(from, radio_request, our, service)
            }
            AppRequest::Chat(chat_request) => {
                self.chat.handle_request(from, chat_request, our, service)
            }
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RadioUpdate {
    PlayMedia(PlayingMedia),
    PlayMediaStartTime(Option<u128>),
    StationState(Option<PlayingMedia>, Vec<Media>),
    NewMedia(Media),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RadioRequest {
    PlayMedia(String, Option<u128>),
    PlayMediaStartTime(Option<u128>),
    AddMediaMetadata(String, MediaMetadata)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayingMedia {
    pub media: Media,
    pub start_time: Option<u128>
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Media {
    pub url: String,
    pub meta: MediaMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaMetadata {
    pub is_livestream: bool,
    pub is_audio_only: bool,
    pub duration: Option<u128>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub tags: Vec<String>,
}

impl Default for MediaMetadata {
    fn default() -> Self {
        MediaMetadata {
            is_livestream: false,
            is_audio_only: false,
            duration: None,
            title: None,
            description: None,
            tags: Vec::new(),
        }
    }
}

impl Media {
    pub fn new(url: String) -> Self {
        Media {
            url,
            meta: MediaMetadata::default(),
        }
    }

    pub fn with_livestream(mut self, is_livestream: bool) -> Self {
        self.meta = self.meta.with_livestream(is_livestream);
        self
    }

    pub fn with_audio_only(mut self, is_audio_only: bool) -> Self {
        self.meta = self.meta.with_audio_only(is_audio_only);
        self
    }

    pub fn with_duration(mut self, duration: u128) -> Self {
        self.meta = self.meta.with_duration(duration);
        self
    }

    pub fn with_title(mut self, title: String) -> Self {
        self.meta = self.meta.with_title(title);
        self
    }

    pub fn with_description(mut self, description: String) -> Self {
        self.meta = self.meta.with_description(description);
        self
    }

    pub fn with_tags(mut self, tags: Vec<String>) -> Self {
        self.meta = self.meta.with_tags(tags);
        self
    }
}

impl MediaMetadata {
    pub fn with_livestream(mut self, is_livestream: bool) -> Self {
        self.is_livestream = is_livestream;
        self
    }

    pub fn with_audio_only(mut self, is_audio_only: bool) -> Self {
        self.is_audio_only = is_audio_only;
        self
    }

    pub fn with_duration(mut self, duration: u128) -> Self {
        self.duration = Some(duration);
        self
    }

    pub fn with_title(mut self, title: String) -> Self {
        self.title = Some(title);
        self
    }

    pub fn with_description(mut self, description: String) -> Self {
        self.description = Some(description);
        self
    }

    pub fn with_tags(mut self, tags: Vec<String>) -> Self {
        self.tags = tags;
        self
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RadioServiceState {
    pub playing: Option<PlayingMedia>,
    pub media_store: HashMap<String, Media>
}

impl RadioServiceState {
    fn new() -> Self {
        RadioServiceState {
            playing: None,
            media_store: HashMap::new(),
        }
    }

    fn handle_subscribe(&mut self, _subscriber_node: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        let upd = RadioUpdate::StationState(self.playing.clone(), self.media_store.values().cloned().collect());
        update_subscribers(AppUpdate::Radio(upd), our, service)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: RadioRequest, our: &Address, service: &Service) -> anyhow::Result<()> {
        if from != our.node() {
            return Ok(());
        }
        match req {
            RadioRequest::PlayMedia(url, start_time) => {
                let media = self.media_store.entry(url.clone()).or_insert_with(|| Media::new(url));
                let playing_media = PlayingMedia {
                    media: media.clone(),
                    start_time: start_time.or_else(|| Some(std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .expect("Time went backwards")
                        .checked_add(std::time::Duration::from_secs(2))
                        .expect("Time overflow")
                        .as_nanos())),
                };
                self.playing = Some(playing_media.clone());
                let upd = RadioUpdate::PlayMedia(playing_media);
                update_subscribers(AppUpdate::Radio(upd), our, service)?;
            }
            RadioRequest::PlayMediaStartTime(start_time) => {
                if let Some(playing_media) = &mut self.playing {
                    playing_media.start_time = start_time;
                    let upd = RadioUpdate::PlayMediaStartTime(start_time);
                    update_subscribers(AppUpdate::Radio(upd), our, service)?;
                }
            }
            RadioRequest::AddMediaMetadata(url, metadata) => {
                let media = if let Some(existing_media) = self.media_store.get_mut(&url) {
                    existing_media.meta = metadata;
                    existing_media.clone()
                } else {
                    let new_media = Media { url: url.clone(), meta: metadata };
                    self.media_store.insert(url, new_media.clone());
                    new_media
                };
                let upd = RadioUpdate::NewMedia(media);
                update_subscribers(AppUpdate::Radio(upd), our, service)?;
            }
        }
        Ok(())
    }
}

call_init!(init);
fn init(our: Address) {
    println!("init radio");
    let mut state = AppState::new(&our);
    let loaded_provider = AppProviderState::load(&our);
    state.provider = loaded_provider;

    let try_ui = http::secure_serve_ui(&our, "radio-ui", vec!["/", "*"]);
    http::secure_bind_ws_path("/", true).unwrap();

    match try_ui {
        Ok(()) => {}
        Err(e) => {
            println!("radio error starting ui: {:?}", e);
        }
    };

    loop {
        match provider_handle_message(&our, &mut state.provider) {
            Ok(()) => {}
            Err(e) => {
                println!("radio error handling message: {:?}", e);
            }
        };
    }
}