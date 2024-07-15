use serde::{Serialize, Deserialize};

use std::collections::{HashMap, HashSet};
use std::str::FromStr;
use std::time::{SystemTime, UNIX_EPOCH};

use std::hash::{Hash, Hasher};
use kinode_process_lib::{println, Address, ProcessId, Request};

#[derive(Debug, Serialize, Deserialize, Clone, Eq, PartialEq)]
pub struct ServiceID {
    pub name: String,
    pub address: Address,
}

impl ServiceID {
    pub fn to_string(&self) -> String {
        format!("{}:{}", self.name, self.address.to_string())
    }
    pub fn from_string(s: &str) -> Option<Self> {
        let parts: Vec<&str> = s.split(':').collect();
        if parts.len() < 2 {
            return None;
        }
        let name = parts[0].to_string();
        let address_str = parts[1..].join(":");
        let address = Address::from_str(&address_str).ok()?;
        Some(ServiceID { name, address })
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Service {
    pub id: ServiceID,
    pub meta: ServiceMetadata,
}

impl Service {
    pub fn new(name: &str, address: Address) -> Self {
        Service {
            id: ServiceID {
                name: name.to_string(),
                address,
            },
            meta: ServiceMetadata::new(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServiceMetadata {
    pub last_sent_presence: Option<u64>,
    pub subscribers: HashSet<String>,
    pub user_presence: HashMap<String, u64>,
    pub access: ServiceAccess,
    pub visibility: ServiceVisibility,
    pub whitelist: HashSet<String>,
}

impl ServiceMetadata {
    pub fn new() -> Self {
        ServiceMetadata {
            last_sent_presence: None,
            subscribers: HashSet::new(),
            user_presence: HashMap::new(),
            access: ServiceAccess::Public,
            visibility: ServiceVisibility::Visible,
            whitelist: HashSet::new(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ServiceAccess {
    Public,
    Whitelist,
    HostOnly
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ServiceVisibility {
    Visible,
    HostOnly,
    Hidden,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum PeerActivity {
    Offline,
    Private,
    Online(u64),
    RecentlyOnline(u64),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ActivitySetting {
    Public,
    Private,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum NameColor {
    Red,
    Blue,
    Green,
    Orange,
    Purple
}

fn get_default_color_for_string(s: &str) -> NameColor {
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    s.hash(&mut hasher);
    let hash = hasher.finish();
    match hash % 5 {
        0 => NameColor::Red,
        1 => NameColor::Blue,
        2 => NameColor::Green,
        3 => NameColor::Orange,
        _ => NameColor::Purple,
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Profile {
    pub bio: String,
    pub name_color: NameColor,
    pub pfp: Option<String>, //url
}

impl Profile {
    pub fn new(node: String) -> Self {
        let name_color = get_default_color_for_string(&node);
        Profile {
            bio: String::new(),
            name_color,
            pfp: None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Peer {
    pub node: String,
    pub hosted_services: Vec<Service>,
    pub profile: Profile,
    pub activity: PeerActivity,
    pub outstanding_request: bool,
    pub last_updated: Option<u64>
}

impl Peer {
    pub fn new(node: String) -> Self {
        Peer {
            node: node.clone(),
            hosted_services: Vec::new(),
            profile: Profile::new(node),
            activity: PeerActivity::Offline,
            outstanding_request: false,
            last_updated: None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum DartfrogInput {
    CreateService(String, String),
    DeleteService(String),
    //
    RequestLocalService(String),
    RequestLocalServiceList,
    // 
    LocalRequestPeer(String),
    LocalRequestAllPeers,
    // 
    LocalFwdPeerRequest(String),
    LocalFwdAllPeerRequests,
    // 
    RemoteRequestPeer,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum DartfrogOutput {
    LocalUser(Profile, PeerActivity, ActivitySetting),
    LocalService(Service),
    LocalServiceList(Vec<Service>),
    // 
    Peer(Peer),
    PeerList(Vec<Peer>),
    // 
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum DartfrogAppInput {
    CreateService(String), // service_name
    DeleteService(String) 
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum DartfrogAppOutput {
    Service(Service),
    ServiceList(Vec<Service>),
    DeleteService(ServiceID)
}

pub const PROCESS_NAME : &str = "dartfrog:dartfrog:herobrine.os";

pub fn get_server_address(node_id: &str) -> Address {
    get_process_address(node_id, PROCESS_NAME)
}

pub fn get_process_address(node_id: &str, process: &str) -> Address {
    let s =
        format!("{}@{}", node_id, process);
    Address::from_str(&s).unwrap()
}

pub fn poke(address: &Address, body: impl Serialize) -> anyhow::Result<()> {
    Request::to(address)
        .body(serde_json::to_vec(&body)?)
        .send()?;
    Ok(())
}