use std::collections::{HashMap, HashSet};

use dartfrog_lib::*;
use kinode_process_lib::{call_init, http, Address};
use serde::{Serialize, Deserialize};

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});

type AppProviderState = ProviderState<AppService, DefaultAppClientState>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppService {
    pub chat: ChatServiceState,
    pub forum: ForumServiceState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppUpdate {
    Chat(ChatUpdate),
    Forum(ForumUpdate),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppRequest {
    Chat(ChatRequest),
    Forum(ForumRequest),
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
            forum: ForumServiceState::new()
        }
    }

    fn handle_unsubscribe(&mut self, _subscriber_node: String, _our: &Address, _service: &Service) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_subscribe(&mut self, subscriber_node: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        self.chat.handle_subscribe(subscriber_node.clone(), our, service)?;
        self.forum.handle_subscribe(subscriber_node, our, service)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        let request = serde_json::from_str::<AppRequest>(&req)?;
        match request {
            AppRequest::Chat(chat_request) => {
                self.chat.handle_request(from, chat_request, our, service)
            }
            AppRequest::Forum(forum_request) => {
                self.forum.handle_request(from, forum_request, our, service)
            }
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForumPost {
    id: String,
    title: String,
    text_contents: String,
    link: Option<String>,
    image_url: Option<String>,
    author: String,
    upvotes: u32,
    downvotes: u32,
    comments: Vec<ForumComment>,
    created_at: u64,
    voted_users: HashMap<String, bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublicForumPost {
    id: String,
    title: String,
    text_contents: String,
    link: Option<String>,
    image_url: Option<String>,
    author: Option<String>,
    upvotes: u32,
    downvotes: u32,
    comments: Vec<ForumComment>,
    created_at: u64,
}

impl ForumPost {
    pub fn to_public(&self, include_author: bool) -> PublicForumPost {
        PublicForumPost {
            id: self.id.clone(),
            title: self.title.clone(),
            text_contents: self.text_contents.clone(),
            link: self.link.clone(),
            image_url: self.image_url.clone(),
            author: if include_author { Some(self.author.clone()) } else { None },
            upvotes: self.upvotes,
            downvotes: self.downvotes,
            comments: self.comments.clone(),
            created_at: self.created_at,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ForumUpdate {
    AllPosts(Vec<PublicForumPost>),
    NewPost(PublicForumPost),
    UpdatedPost(PublicForumPost),
    NewComment(ForumComment),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ForumRequest {
    CreatePost {
        title: String,
        text_contents: String,
        link: Option<String>,
        image_url: Option<String>,
    },
    Vote {
        post_id: String,
        is_upvote: bool,
    },
    CreateComment {
        post_id: String,
        text: String,
    },
    GetPost {
        post_id: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForumComment {
    id: String,
    post_id: String,
    author: String,
    text: String,
    created_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForumServiceState {
    pub posts: HashMap<String, ForumPost>,
    pub next_post_id: u64,
    pub next_comment_id: u64,
}

impl ForumServiceState {
    fn new() -> Self {
        ForumServiceState {
            posts: HashMap::new(),
            next_post_id: 1,
            next_comment_id: 1,
        }
    }

    fn handle_subscribe(&mut self, subscriber_node: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        let public_posts: Vec<PublicForumPost> = self.posts.values().map(|post| post.to_public(true)).collect();
        let upd = ForumUpdate::AllPosts(public_posts);
        update_subscriber(AppUpdate::Forum(upd), &subscriber_node, our, service)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: ForumRequest, our: &Address, service: &Service) -> anyhow::Result<()> {
        match req {
            ForumRequest::CreatePost { title, text_contents, link, image_url } => {
                let post_id = self.next_post_id.to_string();
                self.next_post_id += 1;
                
                let new_post = ForumPost {
                    id: post_id.clone(),
                    title,
                    text_contents,
                    link,
                    image_url,
                    author: from,
                    upvotes: 0,
                    downvotes: 0,
                    comments: Vec::new(),
                    created_at: get_now(),
                    voted_users: HashMap::new(),
                };

                self.posts.insert(post_id, new_post.clone());
                update_subscribers(AppUpdate::Forum(ForumUpdate::NewPost(new_post.to_public(true))), our, service)?;
            }
            ForumRequest::Vote { post_id, is_upvote } => {
                if let Some(post) = self.posts.get_mut(&post_id) {
                    let has_voted = post.voted_users.contains_key(&from);
                    let previous_vote = post.voted_users.get(&from).cloned();

                    match (has_voted, previous_vote, is_upvote) {
                        (false, _, true) => {
                            post.upvotes += 1;
                            post.voted_users.insert(from.clone(), true);
                        }
                        (false, _, false) => {
                            post.downvotes += 1;
                            post.voted_users.insert(from.clone(), false);
                        }
                        (true, Some(true), false) => {
                            post.upvotes -= 1;
                            post.downvotes += 1;
                            post.voted_users.insert(from.clone(), false);
                        }
                        (true, Some(false), true) => {
                            post.downvotes -= 1;
                            post.upvotes += 1;
                            post.voted_users.insert(from.clone(), true);
                        }
                        _ => {} // No change if the vote is the same as before
                    }

                    update_subscribers(AppUpdate::Forum(ForumUpdate::UpdatedPost(post.to_public(true))), our, service)?;
                }
            }
            ForumRequest::CreateComment { post_id, text } => {
                if let Some(post) = self.posts.get_mut(&post_id) {
                    let comment_id = self.next_comment_id.to_string();
                    self.next_comment_id += 1;

                    let new_comment = ForumComment {
                        id: comment_id,
                        post_id: post_id.clone(),
                        author: from,
                        text,
                        created_at: std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap()
                            .as_secs(),
                    };

                    post.comments.push(new_comment.clone());
                    update_subscribers(AppUpdate::Forum(ForumUpdate::NewComment(new_comment)), our, service)?;
                }
            }
            ForumRequest::GetPost { post_id } => {
                if let Some(post) = self.posts.get(&post_id) {
                    update_subscriber(AppUpdate::Forum(ForumUpdate::UpdatedPost(post.to_public(true))), &from, our, service)?;
                }
            }
        }
        Ok(())
    }
}

call_init!(init);
fn init(our: Address) {
    println!("init forum");
    let mut state = AppState::new(&our);
    let loaded_provider = AppProviderState::load(&our);
    state.provider = loaded_provider;

    let try_ui = http::secure_serve_ui(&our, "forum-ui", vec!["/", "*"]);
    http::secure_bind_ws_path("/", true).unwrap();

    match try_ui {
        Ok(()) => {}
        Err(e) => {
            println!("forum error starting ui: {:?}", e);
        }
    };

    loop {
        match provider_handle_message(&our, &mut state.provider) {
            Ok(()) => {}
            Err(e) => {
                println!("forum error handling message: {:?}", e);
            }
        };
    }
}