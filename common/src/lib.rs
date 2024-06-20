use kinode_process_lib::vfs::open_file;
use serde::{Serialize, Deserialize};

use std::collections::{HashMap, HashSet};
use std::str::FromStr;
use std::time::{SystemTime, UNIX_EPOCH};

use std::hash::{Hash, Hasher};
use kinode_process_lib::{Address, Request, println};

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
impl Service {
    pub fn new() -> Service {
        Service {
            id: ServiceId {
                node: String::from(""),
                id: String::from(""),
            },
            metadata: ServiceMetadata {
                subscribers: HashSet::new(),
                user_presence: HashMap::new(),
                plugins: HashSet::new(),
            },
            last_sent_presence: 0,
        }
    }

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
    PluginOutput(String, PluginServiceOutput) // plugin name, pluginOutput
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ClientUpdate {
    ConsumerUpdate(ConsumerUpdate),
    FromPlugin(PluginConsumerOutput),
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
    SubscribeAck(ServiceMetadata),
    ServiceMetadata(ServiceMetadata),
    Kick,
    // TODO better way to encode the plugin update than as a json string?
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
    get_process_address(node_id, PROCESS_NAME)
}

pub fn get_process_address(node_id: &str, process: &str) -> Address {
    let s =
        format!("{}@{}", node_id, process);
    Address::from_str(&s).unwrap()
}

// const PACKAGE_NAME : &str = "dartfrog:herobrine.os";
pub fn get_plugin_address(plugin_name: &str, node_id: &str) -> Address {
    let full_process_name = format!("{}@{}", node_id, plugin_name);
    Address::from_str(&full_process_name).unwrap()
}


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PluginMetadata {
    pub plugin_name: String,
    pub drive_path: String,
    pub service: Service,
}
impl PluginMetadata {
    pub fn new() -> PluginMetadata {
        PluginMetadata {
            plugin_name: String::from(""),
            drive_path: String::from(""),
            service: Service::new(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum PluginServiceInput {
    Init(PluginMetadata),
    Kill,
    ClientJoined(String), // node name
    ClientExited(String), // node name
    ClientRequest(String, String), // node name, untyped request string JSON
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum PluginServiceOutput {
    UpdateSubscribers(String), // untyped update string JSON
    UpdateClient(String, String), // node name, untyped update string JSON
    ShuttingDown
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum PluginConsumerOutput {
    UpdateClient(ServiceId, String), // service id, untyped update string JSON
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum PluginConsumerInput {
    ServiceUpdate(String), // untyped update string JSON
    ConsumerJoined,
    ConsumerExited,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum PluginMessage {
    ServiceInput(ServiceId, PluginServiceInput), // service id, _
    ConsumerInput(ServiceId, PluginConsumerInput),
}

pub fn send_to_frontend(service_id: &ServiceId, update: &String, our: &Address) {
    let server = get_server_address(&our.node);
    let update = DartMessage::ClientUpdate(ClientUpdate::FromPlugin(PluginConsumerOutput::UpdateClient(service_id.clone(), update.clone())));
    let _ = Request::to(server)
        .body(serde_json::to_vec(&update).unwrap())
        .send();
    // println!("sent update to service: {:?}", service_id);
}

#[derive(Debug, Serialize, Deserialize)]
pub enum DartMessage {
    ServerRequest(ServerRequest),
    ClientRequest(ClientRequest),
    ClientUpdate(ClientUpdate),
}

pub fn handle_plugin_update<T, U>(update: PluginMessage, state: &mut PluginState<T, U>, our: &Address) -> anyhow::Result<()>
where
    T: PluginServiceState,
    U: PluginClientState,
{
    match update {
        PluginMessage::ServiceInput(service_id, service_input) => {
            if let Some(service) = state.services.get_mut(&service_id) {
                match service_input {
                    PluginServiceInput::Init(meta) => {
                        // println!("reinitializing service with metadata: {:?}", meta);
                        service.metadata = meta;
                    }
                    PluginServiceInput::ClientJoined(client_id) => {
                        if let Err(e) = service.state.handle_subscribe(client_id, our, &service.metadata) {
                            println!("Error handling subscribe: {}", e);
                        }
                    }
                    PluginServiceInput::ClientExited(client_id) => {
                        if let Err(e) = service.state.handle_unsubscribe(client_id, our, &service.metadata) {
                            println!("Error handling unsubscribe: {}", e);
                        }
                    }
                    PluginServiceInput::ClientRequest(client_id, request) => {
                        if let Err(e) = service.state.handle_request(client_id, request, our, &service.metadata) {
                            println!("Error handling client request: {}", e);
                        }
                    }
                    PluginServiceInput::Kill => {
                        // Remove the service from the active service list
                        // state.services.remove(&service_id);
                        // println!("Service {} has been killed", service_id.id);
                    }
                }
            } else {
                match service_input {
                    PluginServiceInput::Init(meta) => {
                        // println!("initializing plugin with metadata: {:?}", meta);
                        let service = PluginServiceStateWrapper {
                            metadata: meta,
                            state: T::new(),
                        };
                        state.services.insert(service_id, service);
                    }
                    _ => {

                    }
                }
            }
        }
        PluginMessage::ConsumerInput(service_id, consumer_input) => {
            // service.state.handle_consumer_update(consumer_input, our, &service.metadata);
            // println!("handle_plugin_update: consumer input");
            if let Some(client) = state.clients.get_mut(&service_id) {
                match consumer_input {
                    PluginConsumerInput::ServiceUpdate(update) => {
                        if let Err(e) = client.state.handle_update(update, our, &client.metadata) {
                            println!("Error handling service update: {}", e);
                        }
                    }
                    PluginConsumerInput::ConsumerJoined => {
                        if let Err(e) = client.state.handle_new_frontend(our, &client.metadata) {
                            println!("Error handling new frontend: {}", e);
                        }
                    }
                    PluginConsumerInput::ConsumerExited => {
                        // TODO
                    }
                }
            } else {
                match consumer_input {
                    PluginConsumerInput::ConsumerJoined => {
                        let mut metadata = PluginMetadata::new();
                        metadata.service = Service::new();
                        metadata.service.id = service_id.clone();
                        let plugin_name = get_plugin_name_from_address(&our).unwrap();
                        metadata.plugin_name = plugin_name;
                        let client = PluginClientStateWrapper {
                            metadata: metadata,
                            state: U::new(),
                        };
                        state.clients.insert(service_id, client);
                    }
                    _ => {

                    }
                }
            }
        }
    }

    Ok(())
}

pub fn get_plugin_name_from_address(address: &Address) -> anyhow::Result<String> {
    if let Some(plugin_name) = address.to_string().split('@').nth(1) {
        return Ok(plugin_name.to_string());
    }
    Err(anyhow::anyhow!("invalid address: {}", address.node))
}


#[derive(Debug, Clone)]
pub struct PluginState<T, U> 
where
    T: PluginServiceState,
    U: PluginClientState,
{
    pub services: HashMap<ServiceId, PluginServiceStateWrapper<T>>,
    pub clients: HashMap<ServiceId, PluginClientStateWrapper<U>>,
}

impl<T: PluginServiceState, U: PluginClientState> PluginState<T, U> {
    pub fn new() -> Self {
        PluginState {
            services: HashMap::new(),
            clients: HashMap::new(),
        }
    }
}


#[derive(Debug, Clone)]
pub struct PluginServiceStateWrapper<T: PluginServiceState> {
    pub metadata: PluginMetadata,
    pub state: T,
}

// plugin library, probably should be in a separate file
pub trait PluginServiceState: std::fmt::Debug {
    fn new() -> Self;
    fn handle_request(&mut self, from: String, req: String, our: &Address, meta: &PluginMetadata) -> anyhow::Result<()>;
    fn handle_subscribe(&mut self, from: String, our: &Address, meta: &PluginMetadata) -> anyhow::Result<()>;
    fn handle_unsubscribe(&mut self, from: String, our: &Address, meta: &PluginMetadata) -> anyhow::Result<()>;
}

#[derive(Debug, Clone)]
pub struct PluginClientStateWrapper<T: PluginClientState> {
    pub metadata: PluginMetadata,
    pub state: T,
}

pub trait PluginClientState: std::fmt::Debug {
    fn new() -> Self;
    fn handle_update(&mut self, upd: String, our: &Address, meta: &PluginMetadata) -> anyhow::Result<()>;
    fn handle_new_frontend(&mut self, our: &Address, meta: &PluginMetadata) -> anyhow::Result<()>;
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
        DartMessage::ServerRequest(ServerRequest::ServiceRequest(meta.service.id.clone(), ServiceRequest::PluginOutput(meta.plugin_name.clone(), PluginServiceOutput::UpdateClient(to, update))));

    // println!("updating client");
    let _ = Request::to(address)
        .body(serde_json::to_vec(&dart_message).unwrap())
        .send()?;
    Ok(())
}

pub fn update_subscribers(our: &Address, update: impl Serialize, meta: &PluginMetadata) -> anyhow::Result<()> {
    // println!("update_subscribers");
    let update = serde_json::to_string(&update).unwrap();
    let address = get_server_address(&our.node);
    // println!("updating subscribers {:?}", meta.service.id);
    let dart_message = 
        DartMessage::ServerRequest(ServerRequest::ServiceRequest(meta.service.id.clone(), ServiceRequest::PluginOutput(meta.plugin_name.clone(), PluginServiceOutput::UpdateSubscribers(update))));
    let _ = Request::to(address)
        .body(serde_json::to_vec(&dart_message).unwrap())
        .send()?;
    Ok(())
}
