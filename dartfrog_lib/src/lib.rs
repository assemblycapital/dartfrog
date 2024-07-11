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

