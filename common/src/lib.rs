use serde::{Serialize, Deserialize};

use std::collections::{HashMap, HashSet};
use std::str::FromStr;
use std::time::{SystemTime, UNIX_EPOCH};

use std::hash::{Hash, Hasher};
use kinode_process_lib::Address;

#[derive(Debug, Serialize, Deserialize, Clone, Hash)]
pub struct Presence {
    pub time: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ConnectionStatus {
    Connecting(u64), // time when we started connecting
    Connected(u64), // last time heard
    Disconnected,
}

#[derive(Debug, Clone)]
pub struct DartState {
    pub client: ClientState,
    pub server: ServerState,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Service {
    pub id: ServiceId,
    pub metadata: ServiceMetadata,
    pub last_sent_presence: u64,
}

impl Hash for Service {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.id.hash(state);
    }
}

pub fn new_service(id: ServiceId) -> Service {
    Service {
        id: id,
        metadata: new_service_metadata(),
        last_sent_presence: 0,
    }
}

pub fn new_service_metadata() -> ServiceMetadata {
  ServiceMetadata {
      subscribers: HashSet::new(),
      user_presence: HashMap::new(),
      plugins: HashSet::new(),
  }
}
pub fn new_sync_service(id: ServiceId) -> SyncService {
  SyncService {
      id: id,
      metadata: new_service_metadata(),
      connection: ConnectionStatus::Connecting(
          SystemTime::now()
              .duration_since(UNIX_EPOCH)
              .unwrap()
              .as_secs(),
      ),
  }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServerState {
    pub services: HashMap<String, Service>,
    pub drive_path: String,
}
pub fn new_server_state() -> ServerState {
    ServerState {
        services: HashMap::new(),
        drive_path: String::from(""),
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServiceMetadata {
    pub subscribers: HashSet<String>,
    pub user_presence: HashMap<String, Presence>,
    pub plugins: HashSet<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SyncService {
    pub id: ServiceId,
    pub metadata: ServiceMetadata,
    pub connection: ConnectionStatus,
}

#[derive(Hash, Debug, Serialize, Deserialize, Clone, Eq, PartialEq)]
pub struct ConsumerId {
    pub client_node: String,
    pub ws_channel_id: u32,
}

#[derive(Hash, Debug, Serialize, Deserialize, Clone, Eq, PartialEq)]
pub struct ServiceId {
    pub node: String,
    pub id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Consumer {
    pub ws_channel_id: u32,
    pub services: HashMap<ServiceId, SyncService>,
    pub last_active: u64,
}

impl Hash for Consumer{
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.ws_channel_id.hash(state);
    }
}

#[derive(Debug, Clone)]
pub struct ClientState {
    pub consumers: HashMap<u32, Consumer>,
}
pub fn new_client_state() -> ClientState {
    ClientState {
        consumers: HashMap::new(),
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChannelId {
    pub service_id: ServiceId,
    pub consumer_id: ConsumerId,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ServerRequest {
    ServiceRequest(ServiceId, ServiceRequest),
    CreateService(ServiceId, Vec<String>), // service id, plugins
    DeleteService(ServiceId),
    RequestServiceList,
}


#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ServiceRequest {
    Subscribe,
    Unsubscribe,
    PresenceHeartbeat,
    AddPlugin(String),
    RemovePlugin(String),
    PluginRequest(String, String), // plugin name, untyped request string JSON
    PluginOutput(String, PluginOutput) // plugin name, pluginOutput
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ClientUpdate {
    ConsumerUpdate(ConsumerUpdate),
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ConsumerUpdate {
    FromClient(ConsumerClientUpdate),
    FromServer(String, ConsumerServerUpdate),
    FromService(String, String, ConsumerServiceUpdate), // service node, service name
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ConsumerServerUpdate {
    NoSuchService(String),
    ServiceList(Vec<ServiceId>),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ConsumerClientUpdate {
    Todo(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ConsumerServiceUpdate {
    SubscribeAck,
    ServiceMetadata(ServiceMetadata),
    Kick,
    // TODO better way to encode the plugin update than as a json string
    PluginUpdate(String, String), // plugin_name, update 
}
#[derive(Debug, Serialize, Deserialize)]
pub enum ClientRequest{
    ConsumerRequest(u32, ConsumerRequest),
    CreateConsumer(u32),
    DeleteConsumer(u32),
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ConsumerRequest {
    RequestServiceList(String),
    JoinService(ServiceId),
    ExitService(ServiceId),
    ServiceHeartbeat(ServiceId),
    SendToService(ServiceId, ServiceRequest),
}
pub const PROCESS_NAME : &str = "dartfrog:dartfrog:herobrine.os";

pub fn get_server_address(node_id: &str) -> Address {
    let s =
        format!("{}@{}", node_id, PROCESS_NAME);
    Address::from_str(&s).unwrap()
}

const PACKAGE_NAME : &str = "dartfrog:herobrine.os";
pub fn get_plugin_address(plugin_name: &str, node_id: &str, service_name: &str) -> Address {
    let s =
        format!("{}@df-plugin-{}-{}:{}", node_id, plugin_name, service_name, PACKAGE_NAME);
    Address::from_str(&s).unwrap()
}


#[derive(Debug, Serialize, Deserialize)]
pub struct PluginMetadata {
    pub plugin_name: String,
    pub drive_path: String,
    pub service: Service,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum PluginInput {
    Init(PluginMetadata),
    Kill,
    ClientJoined(String), // node name
    ClientExited(String), // node name
    ClientRequest(String, String), // node name, untyped request string JSON
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum PluginOutput {
    UpdateSubscribers(String), // untyped update string JSON
    UpdateClient(String, String), // node name, untyped update string JSON
    ShuttingDown
}

#[derive(Debug, Serialize, Deserialize)]
pub enum DartMessage {
    ServerRequest(ServerRequest),
    ClientRequest(ClientRequest),
    ClientUpdate(ClientUpdate),
}