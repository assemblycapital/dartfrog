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
        if parts.len() != 2 {
            return None;
        }
        let name = parts[0].to_string();
        let address = Address::from_str(parts[1]).ok()?;
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
pub enum DartfrogInput {
    CreateService(String, String),
    DeleteService(String),
    RequestServiceList(String),
    RequestFullServiceList,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum DartfrogOutput {
    Service(String, Service), // host_node, services
    ServiceList(String, Vec<Service>) // host_node, services
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum DartfrogAppInput {
    CreateService(String), // service_name
    DeleteService(String) 
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum DartfrogAppOutput {
    Service(Service)
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
