use kinode_process_lib::vfs::open_file;
use serde::{Serialize, Deserialize};

use std::collections::{HashMap, HashSet};
use std::str::FromStr;
use std::time::{SystemTime, UNIX_EPOCH};

use std::hash::{Hash, Hasher};
use kinode_process_lib::{Address, Request};

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

// const PACKAGE_NAME : &str = "dartfrog:herobrine.os";
pub fn get_plugin_address(plugin_name: &str, node_id: &str) -> Address {
    let full_process_name = format!("{}@{}", node_id, plugin_name);
    Address::from_str(&full_process_name).unwrap()
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


// plugin library, probably should be in a separate file
pub trait PluginState {
    fn new() -> Self;
    fn handle_request(&mut self, from: String, req: String, meta: &PluginMetadata, our: &Address) -> anyhow::Result<()>;
    fn handle_join(&mut self, from: String, meta: &PluginMetadata, our: &Address) -> anyhow::Result<()>;
    fn handle_exit(&mut self, from: String, meta: &PluginMetadata, our: &Address) -> anyhow::Result<()>;
}

pub fn read_service(drive_path: &String, service_id: &ServiceId) -> anyhow::Result<Service> {
    let service_name = service_id.id.clone();
    let file_path = format!("{}/{}.service.txt", drive_path, service_name);
    let file = open_file(&file_path, true, None);
    match file {
        Ok(file) => {
            let bytes = file.read()?;
            if let Ok(service) = serde_json::from_slice::<Service>(&bytes) {
                Ok(service)
            } else {
                Err(anyhow::anyhow!("error parsing service"))
            }
        }
        Err(_e) => {
            Err(anyhow::anyhow!("error opening file"))
        }
    }
}

pub fn update_client(our: &Address, to: String, update: impl Serialize, meta: &PluginMetadata) -> anyhow::Result<()> {
    let update = serde_json::to_string(&update).unwrap();
    let address = get_server_address(&our.node);
    let dart_message = 
        DartMessage::ServerRequest(ServerRequest::ServiceRequest(meta.service.id.clone(), ServiceRequest::PluginOutput(meta.plugin_name.clone(), PluginOutput::UpdateClient(to, update))));
    let _ = Request::to(address)
        .body(serde_json::to_vec(&dart_message).unwrap())
        .send()?;
    Ok(())
}

pub fn update_subscribers(our: &Address, update: impl Serialize, meta: &PluginMetadata) -> anyhow::Result<()> {
    let update = serde_json::to_string(&update).unwrap();
    let address = get_server_address(&our.node);
    let dart_message = 
        DartMessage::ServerRequest(ServerRequest::ServiceRequest(meta.service.id.clone(), ServiceRequest::PluginOutput(meta.plugin_name.clone(), PluginOutput::UpdateSubscribers(update))));
    let _ = Request::to(address)
        .body(serde_json::to_vec(&dart_message).unwrap())
        .send()?;
    Ok(())
}
