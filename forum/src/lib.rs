use std::collections::{HashMap, HashSet};

use dartfrog_lib::*;
use kinode_process_lib::{call_init, println, http, Address};
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

    fn init(&mut self, our: &Address, service: &Service) -> anyhow::Result<()> {
        default_load_service::<Self>(our, &service.id.to_string(), self)
    }

    fn save(&mut self, our: &Address, service: &Service) -> anyhow::Result<()> {
        default_save_service::<Self>(our, &service.id.to_string(), self)
    }

    fn handle_subscribe(&mut self, subscriber_node: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        self.chat.handle_subscribe(subscriber_node.clone(), our, service)?;
        self.forum.handle_subscribe(subscriber_node, our, service)?;
        self.save(our, service)?;
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        let request = serde_json::from_str::<AppRequest>(&req)?;
        match request {
            AppRequest::Chat(chat_request) => {
                self.chat.handle_request(from, chat_request, our, service)?;
            }
            AppRequest::Forum(forum_request) => {
                self.forum.handle_request(from, forum_request, our, service)?;
            }
        }
        self.save(our, service)?;
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForumPost {
    id: u64,
    title: String,
    text_contents: String,
    link: Option<String>,
    image_url: Option<String>,
    author: String,
    upvotes: u32,
    downvotes: u32,
    comments: Vec<u64>,
    created_at: u64,
    voted_users: HashMap<String, bool>,
    is_sticky: bool,
    is_anon: bool,
    thread_id: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublicForumPost {
    id: u64,
    title: String,
    text_contents: String,
    link: Option<String>,
    image_url: Option<String>,
    author: Option<String>,
    upvotes: u32,
    downvotes: u32,
    comments: Vec<u64>,
    created_at: u64,
    is_sticky: bool,
    thread_id: Option<u64>,
}

impl ForumPost {
    pub fn to_public(&self, include_author: bool) -> PublicForumPost {
        PublicForumPost {
            id: self.id,
            title: self.title.clone(),
            text_contents: self.text_contents.clone(),
            link: self.link.clone(),
            image_url: self.image_url.clone(),
            author: if self.is_anon { None } else if include_author { Some(self.author.clone()) } else { None },
            upvotes: self.upvotes,
            downvotes: self.downvotes,
            comments: self.comments.clone(),
            created_at: self.created_at,
            is_sticky: self.is_sticky,
            thread_id: self.thread_id,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ForumUpdate {
    TopPosts(Vec<PublicForumPost>),
    NewPost(PublicForumPost),
    UpdatedPost(PublicForumPost),
    Metadata {
        title: String,
        description: String,
    },
    BannedUsers(Vec<String>),
    DeletedPost(u64),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ForumRequest {
    CreatePost {
        title: String,
        text_contents: String,
        link: Option<String>,
        image_url: Option<String>,
        is_anon: bool,
        thread_id: Option<u64>,
    },
    Vote {
        post_id: u64,
        is_upvote: bool,
    },
    GetPost {
        post_id: u64,
    },
    UpdateMetadata {
        title: Option<String>,
        description: Option<String>,
    },
    BanUser {
        user: String,
    },
    UnbanUser {
        user: String,
    },
    DeletePost {
        post_id: u64,
    },
    CreateStickyPost {
        title: String,
        text_contents: String,
        link: Option<String>,
        image_url: Option<String>,
        is_anon: bool,
    },
    ToggleSticky {
        post_id: u64,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForumServiceState {
    pub posts: HashMap<u64, ForumPost>,
    pub next_post_id: u64,
    pub title: String,
    pub description: String,
    pub banned_users: HashSet<String>,
}

impl ForumServiceState {
    fn new() -> Self {
        ForumServiceState {
            posts: HashMap::new(),
            next_post_id: 1,
            title: "Default Forum Title".to_string(),
            description: "Welcome to the forum!".to_string(),
            banned_users: HashSet::new(),
        }
    }

    fn handle_subscribe(&mut self, subscriber_node: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        let mut public_posts: Vec<PublicForumPost> = self.posts.values()
            .map(|post| post.to_public(true))
            .collect();
        
        // Sort posts: sticky posts first, then by created_at in descending order
        public_posts.sort_by(|a, b| {
            match (a.is_sticky, b.is_sticky) {
                (true, false) => std::cmp::Ordering::Less,
                (false, true) => std::cmp::Ordering::Greater,
                _ => b.created_at.cmp(&a.created_at),
            }
        });
        
        // Take up to 30 most recent top-level posts (including sticky posts)
        let top_posts: Vec<PublicForumPost> = public_posts.into_iter()
            .filter(|post| post.thread_id.is_none())
            .take(30)
            .collect();
        
        let upd = ForumUpdate::TopPosts(top_posts);
        update_subscriber(AppUpdate::Forum(upd), &subscriber_node, our, service)?;
        
        // Send forum metadata
        let metadata_update = ForumUpdate::Metadata {
            title: self.title.clone(),
            description: self.description.clone(),
        };
        update_subscriber(AppUpdate::Forum(metadata_update), &subscriber_node, our, service)?;
        
        // Send banned users list
        let banned_users_update = ForumUpdate::BannedUsers(self.banned_users.iter().cloned().collect());
        update_subscriber(AppUpdate::Forum(banned_users_update), &subscriber_node, our, service)?;
        
        Ok(())
    }

    fn handle_request(&mut self, from: String, req: ForumRequest, our: &Address, service: &Service) -> anyhow::Result<()> {
        match req {
            ForumRequest::CreatePost { .. } => {
                if self.banned_users.contains(&from) {
                    return Ok(());
                }
            }
            _ => {}
        }

        match req {
            ForumRequest::CreatePost { title, text_contents, link, image_url, is_anon, thread_id } => {
                let post_id = self.next_post_id;
                self.next_post_id += 1;
                
                let new_post = ForumPost {
                    id: post_id,
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
                    is_sticky: false,
                    is_anon,
                    thread_id,
                };

                if let Some(thread_id) = thread_id {
                    if let Some(parent_post) = self.posts.get_mut(&thread_id) {
                        parent_post.comments.push(post_id);
                    }
                }

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
            ForumRequest::GetPost { post_id } => {
                if let Some(post) = self.posts.get(&post_id) {
                    update_subscriber(AppUpdate::Forum(ForumUpdate::UpdatedPost(post.to_public(true))), &from, our, service)?;
                }
            }
            ForumRequest::UpdateMetadata { title, description } => {
                if from == our.node {
                    let old_title = self.title.clone();
                    let old_description = self.description.clone();
                    
                    if let Some(new_title) = title {
                        self.title = new_title;
                    }
                    if let Some(new_description) = description {
                        self.description = new_description;
                    }

                    if self.title != old_title || self.description != old_description {
                        let metadata_update = ForumUpdate::Metadata {
                            title: self.title.clone(),
                            description: self.description.clone(),
                        };
                        update_subscribers(AppUpdate::Forum(metadata_update), our, service)?;
                    }
                }
            }

            ForumRequest::BanUser { user } => {
                if from == our.node {
                    self.banned_users.insert(user);
                    self.send_banned_users_update(our, service)?;
                }
            }

            ForumRequest::UnbanUser { user } => {
                if from == our.node {
                    self.banned_users.remove(&user);
                    self.send_banned_users_update(our, service)?;
                }
            }

            ForumRequest::DeletePost { post_id } => {
                if from == our.node {
                    if let Some(removed_post) = self.posts.remove(&post_id) {
                        let delete_update = ForumUpdate::DeletedPost(post_id);
                        update_subscribers(AppUpdate::Forum(delete_update), our, service)?;
                    }
                }
            }

            ForumRequest::CreateStickyPost { title, text_contents, link, image_url, is_anon } => {
                if from == our.node {
                    let post_id = self.next_post_id;
                    self.next_post_id += 1;
                    
                    let new_post = ForumPost {
                        id: post_id,
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
                        is_sticky: true,
                        is_anon: is_anon,
                        thread_id: None,
                    };

                    self.posts.insert(post_id, new_post.clone());
                    update_subscribers(AppUpdate::Forum(ForumUpdate::NewPost(new_post.to_public(true))), our, service)?;
                }
            }

            ForumRequest::ToggleSticky { post_id } => {
                if from == our.node {
                    if let Some(post) = self.posts.get_mut(&post_id) {
                        post.is_sticky = !post.is_sticky;
                        update_subscribers(AppUpdate::Forum(ForumUpdate::UpdatedPost(post.to_public(true))), our, service)?;
                    }
                }
            }
        }
        Ok(())
    }

    fn send_banned_users_update(&self, our: &Address, service: &Service) -> anyhow::Result<()> {
        let banned_users_update = ForumUpdate::BannedUsers(self.banned_users.iter().cloned().collect());
        update_subscribers(AppUpdate::Forum(banned_users_update), our, service)
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