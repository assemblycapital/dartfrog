use kinode_process_lib::vfs::open_file;
use serde::{Serialize, Deserialize};

use std::collections::{HashMap, HashSet};
use std::str::FromStr;
use std::time::{SystemTime, UNIX_EPOCH};

use std::hash::{Hash, Hasher};
use kinode_process_lib::{println, Address, ProcessId, Request};

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
                last_sent_presence: 0,
            },
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
    }
}

pub fn new_service_metadata() -> ServiceMetadata {
  ServiceMetadata {
      subscribers: HashSet::new(),
      user_presence: HashMap::new(),
      plugins: HashSet::new(),
      last_sent_presence: 0,
  }
}
pub fn new_sync_service(id: ServiceId) -> SyncService {
  SyncService {
      service: new_service(id),
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
    pub last_sent_presence: u64,
    pub plugins: HashSet<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SyncService {
    pub service: Service,
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
    PluginRequest(String, String),
    // PluginOutput(String, PluginServiceOutput) // plugin name, pluginOutput
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ClientUpdate {
    ConsumerUpdate(ConsumerUpdate),
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ConsumerUpdate {
    FromServer(String, ConsumerServerUpdate),
    FromService(String, String, ConsumerServiceUpdate), // service node, service name
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ConsumerServerUpdate {
    NoSuchService(String),
    ServiceList(HashMap<String, ServiceMetadata>), // serviceid as string
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ConsumerServiceUpdate {
    SubscribeAck(ServiceMetadata),
    ServiceMetadata(ServiceMetadata),
    Kick,
    // TODO better way to encode the plugin update than as a json string?
    MessageFromPluginServiceToClient(String, String), // plugin_name, update 
    MessageFromPluginServiceToFrontend(String, String), // plugin_name, update 
    MessageFromPluginClient(String, String), // plugin_name, update 
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
    SendToPluginClient(ServiceId, String, String), // service id, plugin name, update
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
pub fn get_plugin_address(plugin_name: &str, node_id: &str) -> anyhow::Result<Address, anyhow::Error> {
    // println!("getting plugin address for plugin: {:?}, node: {:?}", plugin_name, node_id);
    let full_process_name = format!("{}@{}", node_id, plugin_name);
    // println!("constructed full process name: {:?}", full_process_name);

    match address_from_string(&full_process_name) {
        Ok(address) => {
            // println!("successfully parsed address: {:?}", address);
            Ok(address)
        },
        Err(e) => {
            // println!("error parsing address from string '{}': {}", full_process_name, e);
            Err(anyhow::anyhow!("error getting plugin address: {}", e))
        }
    }
}
pub fn get_service_id_string(service_id: &ServiceId) -> String {
    format!("{}.{}", service_id.id, service_id.node)
}

// TODO for some reason Address::from_str panics instead of returning error
fn address_from_string(input: &str) -> anyhow::Result<Address> {
    // split string on '@' and ensure there is exactly one '@'
    let parts: Vec<&str> = input.split('@').collect();
    if parts.len() < 2 {
        return Err(anyhow::anyhow!("missing node id"));
    } else if parts.len() > 2 {
        return Err(anyhow::anyhow!("too many ats"));
    }
    let node = parts[0].to_string();
    if node.is_empty() {
        return Err(anyhow::anyhow!("missing node id"));
    }

    // split the rest on ':' and ensure there are exactly three ':'
    let segments: Vec<&str> = parts[1].split(':').collect();
    if segments.len() < 3 {
        return Err(anyhow::anyhow!("missing field"));
    } else if segments.len() > 3 {
        return Err(anyhow::anyhow!("too many colons"));
    }
    let process_name = segments[0].to_string();
    if process_name.is_empty() {
        return Err(anyhow::anyhow!("missing field"));
    }
    let package_name = segments[1].to_string();
    if package_name.is_empty() {
        return Err(anyhow::anyhow!("missing field"));
    }
    let publisher_node = segments[2].to_string();
    if publisher_node.is_empty() {
        return Err(anyhow::anyhow!("missing field"));
    }

    Ok(Address {
        node,
        process: ProcessId {
            process_name,
            package_name,
            publisher_node,
        },
    })
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PluginMetadata {
    pub plugin_name: String,
    pub service: Service,
}
impl PluginMetadata {
    pub fn new() -> PluginMetadata {
        PluginMetadata {
            plugin_name: String::from(""),
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
    Message(String, PluginNodeType, String), // node name, untyped request string JSON
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum PluginServiceOutput {
    ToAllClients(String), // untyped update string JSON
    ToAllFrontends(String), // untyped update string JSON
    ToClient(String, String), // node name, untyped update string JSON
    ToFrontend(String, String), // node name, untyped update string JSON
    ShuttingDown
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum PluginClientOutput {
    ToAllFrontends(ServiceId, String), // service id, untyped update string JSON
    ToService(ServiceId, String), // service id, untyped update string JSON
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum PluginClientInput {
    FromService(String), // untyped update string JSON
    FromFrontend(String), // untyped update string JSON
    FrontendJoined,
    FrontendExited,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum PluginMessage {
    ServiceInput(Service, PluginServiceInput), // service id, _
    ClientInput(Service, PluginClientInput),
}


#[derive(Debug, Serialize, Deserialize)]
pub enum DartMessage {
    ServerRequest(ServerRequest),
    ClientRequest(ClientRequest),
    ClientUpdate(ClientUpdate),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum PluginNodeType {
    Frontend,
    Client,
    Service, 
}

pub fn handle_plugin_update<T, U>(update: PluginMessage, state: &mut PluginState<T, U>, our: &Address) -> anyhow::Result<()>
where
    T: PluginServiceState,
    U: PluginClientState,
{
    match update {
        PluginMessage::ServiceInput(dart_service, service_input) => {
            if let Some(service) = state.services.get_mut(&dart_service.id) {
                service.metadata.service = dart_service;
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
                    PluginServiceInput::Message(client_id, node_type, request) => {
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
                        state.services.insert(dart_service.id, service);
                    }
                    _ => {

                    }
                }
            }
        }
        PluginMessage:: ClientInput(dart_service, client_input) => {
            // service.state.handle_consumer_update(consumer_input, our, &service.metadata);
            // println!("handle_plugin_update: consumer input");
            if let Some(client) = state.clients.get_mut(&dart_service.id) {
                client.metadata.service = dart_service.clone();
                match client_input {
                    PluginClientInput::FromService(update) => {
                        if let Err(e) = client.state.handle_service_message(update, our, &client.metadata) {
                            println!("Error handling service update: {}", e);
                        }
                    }
                    PluginClientInput::FromFrontend(update) => {
                        if let Err(e) = client.state.handle_frontend_message(update, our, &client.metadata) {
                            println!("Error handling service update: {}", e);
                        }
                    }
                    PluginClientInput::FrontendJoined => {
                        if let Err(e) = client.state.handle_new_frontend(our, &client.metadata) {
                            println!("Error handling new frontend: {}", e);
                        }
                    }
                    PluginClientInput::FrontendExited => {
                        // TODO
                    }
                }
            } else {
                match client_input {
                    // TODO this should probably be initialized from some other event
                    PluginClientInput::FrontendJoined => {
                        let mut metadata = PluginMetadata::new();
                        metadata.service = dart_service.clone();
                        let plugin_name = get_plugin_name_from_address(&our).unwrap();
                        metadata.plugin_name = plugin_name;
                        let client = PluginClientStateWrapper {
                            metadata: metadata,
                            state: U::new(),
                        };
                        state.clients.insert(dart_service.id, client);
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
pub struct DefaultPluginServiceState;

impl PluginServiceState for DefaultPluginServiceState {
    fn new() -> Self {
        DefaultPluginServiceState
    }

    fn handle_request(&mut self, _from: String, _req: String, _our: &Address, _meta: &PluginMetadata) -> anyhow::Result<()> {
        // Default implementation
        Ok(())
    }

    fn handle_subscribe(&mut self, _from: String, _our: &Address, _meta: &PluginMetadata) -> anyhow::Result<()> {
        // Default implementation
        Ok(())
    }

    fn handle_unsubscribe(&mut self, _from: String, _our: &Address, _meta: &PluginMetadata) -> anyhow::Result<()> {
        // Default implementation
        Ok(())
    }
}


#[derive(Debug, Clone)]
pub struct PluginClientStateWrapper<T: PluginClientState> {
    pub metadata: PluginMetadata,
    pub state: T,
}

pub trait PluginClientState: std::fmt::Debug {
    fn new() -> Self;
    fn handle_service_message(&mut self, upd: String, our: &Address, meta: &PluginMetadata) -> anyhow::Result<()>;
    fn handle_frontend_message(&mut self, upd: String, our: &Address, meta: &PluginMetadata) -> anyhow::Result<()>;
    fn handle_new_frontend(&mut self, our: &Address, meta: &PluginMetadata) -> anyhow::Result<()>;
}

#[derive(Debug, Clone)]
pub struct DefaultPluginClientState;

impl PluginClientState for DefaultPluginClientState {
    fn new() -> Self {
        DefaultPluginClientState
    }

    fn handle_service_message(&mut self, _upd: String, _our: &Address, _meta: &PluginMetadata) -> anyhow::Result<()> {
        // Default implementation
        Ok(())
    }

    fn handle_frontend_message(&mut self, _upd: String, _our: &Address, _meta: &PluginMetadata) -> anyhow::Result<()> {
        // Default implementation
        Ok(())
    }

    fn handle_new_frontend(&mut self, _our: &Address, _meta: &PluginMetadata) -> anyhow::Result<()> {
        // Default implementation
        Ok(())
    }
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

pub fn send_to_frontend(update: &String, meta: &PluginMetadata, our: &Address) -> anyhow::Result<()> {
    let address = get_server_address(&our.node);
    let dart_message = 
        DartMessage::ClientUpdate(ClientUpdate::ConsumerUpdate(ConsumerUpdate::FromService(
            meta.service.id.node.clone(),
            meta.service.id.id.clone(),
            ConsumerServiceUpdate::MessageFromPluginClient(meta.plugin_name.clone(), update.clone())
        )));
    let res = Request::to(address)
        .body(serde_json::to_vec(&dart_message).unwrap())
        .send();
    match res {
        Ok(_) => Ok(()),
        Err(e) => {
            println!("error sending to frontend: {:?}", e);
            // weird, but don't crash
            Ok(())
        } 
    }
}

pub fn update_client(_our: &Address, to: String, update: impl Serialize, meta: &PluginMetadata) -> anyhow::Result<()> {
    plugin_service_to_client(to, update, meta)
}


pub fn plugin_service_to_client_frontend(to: String, update: impl Serialize, meta: &PluginMetadata) -> anyhow::Result<()> {
    let update = serde_json::to_string(&update).unwrap();
    let address = get_server_address(&to);
    let dart_message = 
        DartMessage::ClientUpdate(ClientUpdate::ConsumerUpdate(ConsumerUpdate::FromService(
            meta.service.id.node.clone(),
            meta.service.id.id.clone(),
            ConsumerServiceUpdate::MessageFromPluginServiceToFrontend(meta.plugin_name.clone(), update)
        )));
    let _ = Request::to(address)
        .body(serde_json::to_vec(&dart_message).unwrap())
        .send()?;
    Ok(())
}

pub fn plugin_service_to_client(to: String, update: impl Serialize, meta: &PluginMetadata) -> anyhow::Result<()> {
    let update = serde_json::to_string(&update).unwrap();
    let address = get_server_address(&to);
    let dart_message = 
        DartMessage::ClientUpdate(ClientUpdate::ConsumerUpdate(ConsumerUpdate::FromService(
            meta.service.id.node.clone(),
            meta.service.id.id.clone(),
            ConsumerServiceUpdate::MessageFromPluginServiceToClient(meta.plugin_name.clone(), update)
        )));
    let _ = Request::to(address)
        .body(serde_json::to_vec(&dart_message).unwrap())
        .send()?;
    Ok(())
}

pub fn update_subscribers(_our: &Address, update: impl Serialize, meta: &PluginMetadata) -> anyhow::Result<()> {
    plugin_service_to_all_client_frontends(update, meta)
}

pub fn update_subscriber_clients(_our: &Address, update: impl Serialize, meta: &PluginMetadata) -> anyhow::Result<()> {
    plugin_service_to_all_clients(update, meta)
}

pub fn plugin_service_to_all_client_frontends(update: impl Serialize, meta: &PluginMetadata) -> anyhow::Result<()> {
    for client in meta.service.metadata.subscribers.iter() {
        plugin_service_to_client_frontend(client.clone(), &update, meta)?;
    }
    Ok(())
}
pub fn plugin_service_to_all_clients(update: impl Serialize, meta: &PluginMetadata) -> anyhow::Result<()> {
    for client in meta.service.metadata.subscribers.iter() {
        plugin_service_to_client(client.clone(), &update, meta)?;
    }
    Ok(())
}
