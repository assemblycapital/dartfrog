use kinode_process_lib::http::{send_ws_push, HttpServerRequest, WsMessageType};
use kinode_process_lib::vfs::{create_drive, open_file};
use serde::de::DeserializeOwned;
use serde::{Serialize, Deserialize};

use std::collections::{HashMap, HashSet};
use std::str::FromStr;
use std::time::{SystemTime, UNIX_EPOCH};

use std::hash::{Hash, Hasher};
use kinode_process_lib::{await_message, get_blob, println, Address, LazyLoadBlob, Request, get_typed_state, set_state};
use kinode_process_lib::timer::set_timer;

pub const DARTFROG_VERSION: &str = "v0.3.2";

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
    pub fn to_public(self) -> PublicService {
        let subscriber_count = self.meta.subscribers.len() as u64;
        PublicService {
            id: self.id,
            meta: PublicServiceMetadata {
                title: self.meta.title,
                description: self.meta.description,
                last_sent_presence: self.meta.last_sent_presence,
                subscribers: if self.meta.publish_subscribers {
                    Some(self.meta.subscribers)
                } else {
                    None
                },
                subscriber_count: if self.meta.publish_subscriber_count {
                    Some(subscriber_count)
                } else {
                    None
                },
                user_presence: if self.meta.publish_user_presence {
                    Some(self.meta.user_presence)
                } else {
                    None
                },
                access: self.meta.access,
                visibility: self.meta.visibility,
                whitelist: if self.meta.publish_whitelist {
                    Some(self.meta.whitelist)
                } else {
                    None
                },
            },
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PublicService {
    pub id: ServiceID,
    pub meta: PublicServiceMetadata,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServiceMetadata {
    pub title: Option<String>,
    pub description: Option<String>,
    pub last_sent_presence: Option<u64>,
    pub subscribers: HashSet<String>,
    pub user_presence: HashMap<String, u64>,
    pub access: ServiceAccess,
    pub visibility: ServiceVisibility,
    pub whitelist: HashSet<String>,
    pub publish_user_presence: bool,
    pub publish_subscribers: bool,
    pub publish_subscriber_count: bool,
    pub publish_whitelist: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PublicServiceMetadata {
    pub title: Option<String>,
    pub description: Option<String>,
    pub last_sent_presence: Option<u64>,
    pub subscribers: Option<HashSet<String>>,
    pub subscriber_count: Option<u64>,
    pub user_presence: Option<HashMap<String, u64>>,
    pub access: ServiceAccess,
    pub visibility: ServiceVisibility,
    pub whitelist: Option<HashSet<String>>,
}

impl ServiceMetadata {
    pub fn new() -> Self {
        ServiceMetadata {
            title: None,
            description: None,
            last_sent_presence: None,
            subscribers: HashSet::new(),
            user_presence: HashMap::new(),
            access: ServiceAccess::Public,
            visibility: ServiceVisibility::Visible,
            whitelist: HashSet::new(),
            publish_user_presence: true,
            publish_subscribers: true,
            publish_subscriber_count: true,
            publish_whitelist: true,
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
    VisibleToHost,
    Hidden,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum PeerActivity {
    Online(u64),
    Offline(u64),
    Private,
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
pub struct PeerData {
    pub hosted_services: Vec<PublicService>,
    pub profile: Profile,
    pub activity: PeerActivity,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Peer {
    pub node: String,
    pub peer_data: Option<PeerData>,
    pub outstanding_request: Option<u64>,
    pub last_updated: Option<u64>
}

impl Peer {
    pub fn new(node: String) -> Self {
        Peer {
            node: node.clone(),
            peer_data: None,
            outstanding_request: None,
            last_updated: None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum VersionControl {
    RequestVersion,
    RequestVersionResponse(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServiceCreationOptions {
    pub service_name: String,
    pub process_name: String,
    pub access: ServiceAccess,
    pub visibility: ServiceVisibility,
    pub whitelist: Vec<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub publish_user_presence: bool,
    pub publish_subscribers: bool,
    pub publish_subscriber_count: bool,
    pub publish_whitelist: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServiceEditOptions {
    pub title: Option<String>,
    pub description: Option<String>,
    pub access: Option<ServiceAccess>,
    pub visibility: Option<ServiceVisibility>,
    pub whitelist: Option<Vec<String>>,
    pub publish_user_presence: Option<bool>,
    pub publish_subscribers: Option<bool>,
    pub publish_subscriber_count: Option<bool>,
    pub publish_whitelist: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum DartfrogInput {
    CreateService(ServiceCreationOptions),
    EditService {
        id: String,
        options: ServiceEditOptions,
    },
    DeleteService(String),
    SetProfile(Profile),
    SetActivitySetting(ActivitySetting),
    //
    Heartbeat,
    //
    RequestLocalService(String),
    RequestLocalServiceList,
    // 
    LocalRequestPeer(String),
    LocalDeletePeer(String),
    LocalRequestAllPeers,
    // 
    LocalFwdPeerRequest(String),
    LocalFwdAllPeerRequests,
    // 
    RemoteRequestPeer,
    RemoteResponsePeer(PeerData),
    RemoteRequestAllPeerNodes,
    RemoteResponseAllPeerNodes(Vec<String>),
    // 
    LocalDirectMessages(LocalDirectMessagePoke),
    RemoteDirectMessages(RemoteDirectMessagePoke),
    //
    RequestVersion,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageStore {
    pub peer_node: String,
    pub history: Vec<DirectMessage>
}

impl MessageStore {
    pub fn new(peer_node : String) -> Self {
        MessageStore {
            peer_node: peer_node,
            history: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirectMessage {
    pub id: String,
    pub from: String,
    pub is_unread: bool,
    pub contents: String,
    pub time_received: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum LocalDirectMessagePoke {
    CreateMessageStore(String), // node
    SendMessage(String, String), // node, message
    ClearUnreadMessageStore(String), // node
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum RemoteDirectMessagePoke {
    SendMessage(String, String), // text message content
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
    Node(String),
    NodeList(Vec<String>),
    //
    MessageStore(MessageStore),
    MessageStoreList(Vec<MessageStore>),
    //
    RequestVersionResponse(String, String),
}

pub fn check_subscribe_permission(service: &Service, source: &Address) -> bool {
    if source.process != service.id.address.process {
        return false
    }
    match service.meta.access {
        ServiceAccess::Public => return true,
        ServiceAccess::Whitelist => {
            return service.meta.whitelist.contains(&source.node)
        }
        ServiceAccess::HostOnly => {
            return source.node == service.id.address.node
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum FrontendRequest {
    Meta(FrontendMetaRequest),
    Channel(FrontendChannelRequest),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum FrontendMetaRequest {
    RequestMyServices,
    CreateService(ServiceCreationOptions),
    DeleteService(String),
    EditService(String, ServiceEditOptions),
    SetService(String),
    Unsubscribe,
    RequestPeer(String),
    RequestPeerList(Vec<String>),
    RequestKnownPeers,
    MessageProcess(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum FrontendChannelRequest {
    Heartbeat,
    MessageClient(String),
    MessageServer(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum FrontendUpdate {
    Meta(FrontendMetaUpdate),
    Channel(FrontendChannelUpdate),
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum FrontendMetaUpdate {
    MyServices(Vec<Service>),
    Peer(Peer),
    PeerList(Vec<Peer>),
    FromProcess(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum FrontendChannelUpdate {
    Metadata(ServiceMetadata),
    PublicMetadata(PublicServiceMetadata),
    SubscribeAck,
    SubscribeNack(SubscribeNack),
    Kick(KickReason),
    FromServer(String),
    FromClient(String),
}


#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum DartfrogToProvider {
    CreateService(ServiceCreationOptions),
    EditService(String, ServiceEditOptions),
    DeleteService(String),
    Peer(Peer),
    PeerList(Vec<Peer>),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ProviderInput {
    DartfrogRequest(DartfrogToProvider),
    ProviderUserInput(String, ProviderUserInput),
    ProviderServiceInput(String, ProviderServiceInput),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ProviderServiceInput {
    Subscribe,
    Unsubscribe,
    Heartbeat,
    AppMessage(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ProviderUserInput {
    FromFrontend(String),
    FromService(UpdateFromService),
    FromClient(UpdateFromClient),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum UpdateFromClient {
    AppMessageToFrontend(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum SubscribeNack {
    ServiceDoesNotExist,
    Unauthorized,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum KickReason {
    Custom(String),
    ServiceDeleted,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum UpdateFromService {
    AppMessageToClient(String),
    AppMessageToFrontend(String),
    PublicMetadata(PublicServiceMetadata),
    Metadata(ServiceMetadata),
    SubscribeAck,
    SubscribeNack(SubscribeNack),
    Kick(KickReason),
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ProviderOutput {
    Service(Service),
    ServiceList(Vec<Service>),
    DeleteService(ServiceID),
    RequestPeer(String),
    RequestPeerList(Vec<String>),
    FrontendActivity,
    RequestKnownPeers,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Consumer {
    pub ws_channel_id: u32,
    pub last_active: u64,
    pub service_id: Option<String>,
}

impl Consumer {
    pub fn new(id:u32) -> Self {
        Consumer {
            ws_channel_id: id,
            last_active: get_now(),
            service_id: None,
        }
    }
}
impl Hash for Consumer{
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.ws_channel_id.hash(state);
    }
}

const CONSUMER_TIMEOUT : u64 = 10*60; // 10 minutes

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Client {
    pub id: ServiceID,
    pub meta: Option<PublicServiceMetadata>,
    pub last_visited: u64,
    pub last_heard_from_host: Option<u64>,
}
pub fn get_drive_path(our: &Address) -> String {
    format!("/{}/{}", our.package_id().to_string(), "dartfrog-provider")
}

#[derive(Debug, Clone)]
pub struct ProviderState<T, U, V>
where
    T: AppServiceState,
    U: AppClientState,
{
    pub services: HashMap<String, AppServiceStateWrapper<T>>,
    pub clients: HashMap<String, AppClientStateWrapper<U>>,
    pub process: V,
    pub consumers: HashMap<u32, Consumer>,
    pub timer_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderSaveState {
    pub services: HashMap<String, Service>,
    pub clients: HashMap<String, Client>,
    pub consumers: HashMap<u32, Consumer>,
}

impl<T, U, V> ProviderState<T, U, V>
where
    T: AppServiceState,
    U: AppClientState,
    V: AppProcessState,
{
    pub fn new(our: &Address) -> Self {
        let _ = create_drive(our.package_id(), "dartfrog-provider", None);

        // 
        ProviderState {
            services: HashMap::new(),
            clients: HashMap::new(),
            process: V::new(),
            consumers: HashMap::new(),
            timer_active: false,
        }
    }

    /// Helper function to serialize and save the process state.
    pub fn save(&mut self, _our:&Address) -> anyhow::Result<()> {
        let mut services = HashMap::new();
        let mut clients = HashMap::new();
    
        // Save services
        for (service_id, wrapper) in &mut self.services {
            services.insert(service_id.clone(), wrapper.service.clone());
        }
    
        // Save clients
        for (client_id, wrapper) in &mut self.clients {
            clients.insert(client_id.clone(), wrapper.client.clone());
        }
    
        // Convert to ProviderSaveState
        let save_state = ProviderSaveState {
            services,
            clients,
            consumers: self.consumers.clone(),
        };
        
        // Save the state
        set_state(&bincode::serialize(&save_state)?);

        Ok(())
    }

    /// Helper function to deserialize the process state.
    pub fn load(our: &Address) -> Self {
        let saved_state = match get_typed_state(|bytes| Ok(bincode::deserialize::<ProviderSaveState>(bytes)?)) {
            Some(loaded) => {
                loaded
            }
            _ => {
                return Self::new(our)
            }
        };

        let mut provider_state = ProviderState {
            services: HashMap::new(),
            clients: HashMap::new(),
            process: V::new(),
            consumers: saved_state.consumers,
            timer_active: false,
        };

        // Load services
        for (service_id, service) in saved_state.services {
            let mut state = T::new();
            let _ = state.init(our, &service);
            provider_state.services.insert(service_id, AppServiceStateWrapper {
                service: service.clone(),
                state,
            });
            let _ = poke(&get_server_address(our.node()), ProviderOutput::Service(service));
        }

        // Load clients
        for (client_id, client) in saved_state.clients {
            let mut state = U::new();
            let _ = state.init(our, &client);

            provider_state.clients.insert(client_id, AppClientStateWrapper {
                client,
                state,
            });
        }
        provider_state
    }
}

pub fn default_save_service<T: Serialize>(
    our: &Address,
    service_id: &String,
    service_state: &T
) -> anyhow::Result<()> {
    let file_path = format!("{}/service.{}", &get_drive_path(our), service_id);
    let file = open_file(&file_path, true, None)?;
    
    let buffer = serde_json::to_vec(service_state)?;
    match file.write(&buffer) {
        Ok(_) => {}
        Err(e) => {
            println!("Error writing service state: {:?}", e);
        }
    }    
    Ok(())
}

pub fn default_save_client<U: Serialize>(
    our: &Address,
    client_id: &String,
    client_state: &U,
) -> anyhow::Result<()> {
    let file_path = format!("{}/client.{}", &get_drive_path(our), client_id);
    let file = open_file(&file_path, true, None)?;
    
    let buffer = serde_json::to_vec(client_state)?;
    match file.write(&buffer) {
        Ok(_) => {}
        Err(e) => {
            println!("Error writing client state: {:?}", e);
        }
    }
    
    Ok(())
}

pub fn default_load_service<T: DeserializeOwned>(
    our: &Address,
    service_id: &String,
    service_state: &mut T,
) -> anyhow::Result<()> {
    let file_path = format!("{}/service.{}", &get_drive_path(our), service_id);
    match open_file(&file_path, true, None) {
        Ok(file) => {
            match file.read() {
                Ok(buf) => {
                    match serde_json::from_slice(&buf) {
                        Ok(state) => {
                            *service_state = state;
                            Ok(())
                        },
                        Err(e) => {
                            println!("service couldn't load: {:?}", service_id);
                            // println!("Error deserializing service state: {:?} {:?}", service_id, e,);
                            // failed to load prev state
                            Ok(())
                        }
                    }
                },
                Err(e) => {
                    println!("Error reading service file: {:?}", e);
                    Ok(())
                }
            }
        },
        Err(e) => {
            println!("Error opening service file: {:?}", e);
            Ok(())
        }
    }
}

pub fn default_load_client<U: DeserializeOwned>(
    our: &Address,
    client_id: &String,
    client_state: &mut U,
) -> anyhow::Result<()> {
    let file_path = format!("{}/client.{}", &get_drive_path(our), client_id);
    let file = open_file(&file_path, true, None)?;
    let buf = file.read()?;
    let state = serde_json::from_slice(&buf)?;
    *client_state = state;
    Ok(())
}

#[derive(Debug, Clone)]
pub struct AppServiceStateWrapper<T: AppServiceState> {
    pub service: Service,
    pub state: T,
}

#[derive(Debug, Clone)]
pub struct AppClientStateWrapper<T: AppClientState> {
    pub client: Client,
    pub state: T,
}

pub trait AppServiceState: {
    fn new() -> Self;

    fn init(&mut self, _our: &Address, _service: &Service) -> anyhow::Result<()> {
        Ok(())
    }

    fn save(&mut self, _our: &Address, _service: &Service) -> anyhow::Result<()> {
        Ok(())
    }

    fn kill(&mut self, _our: &Address, _service: &Service) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_request(&mut self, _from: String, _req: String, _our: &Address, _service: &Service) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_subscribe(&mut self, _from: String, _our: &Address, _service: &Service) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_unsubscribe(&mut self, _from: String, _our: &Address, _service: &Service) -> anyhow::Result<()> {
        Ok(())
    }
}

pub trait AppClientState: std::fmt::Debug {
    fn new() -> Self;

    fn init(&mut self, _our: &Address, _client: &Client) -> anyhow::Result<()> {
        Ok(())
    }
    fn save(&mut self, _our: &Address, _client: &Client) -> anyhow::Result<()> {
        Ok(())
    }
    fn kill(&mut self, _our: &Address, _client: &Client) -> anyhow::Result<()> {
        Ok(())
    }
    fn handle_service_message(&mut self, _message: String, _our: &Address, _client: &Client) -> anyhow::Result<()> {
        Ok(())
    }
    fn handle_frontend_message(&mut self, _message: String, _our: &Address, _client: &Client, _consumer: &Consumer) -> anyhow::Result<()> {
        Ok(())
    }
    fn handle_new_frontend(&mut self, _our: &Address, _client: &Client, _consumer: &Consumer) -> anyhow::Result<()> {
        Ok(())
    }
}
pub trait AppProcessState: std::fmt::Debug {
    fn new() -> Self;
    fn init(&mut self, _our: &Address) -> anyhow::Result<()> {
        Ok(())
    }
    fn save(&mut self, _our: &Address) -> anyhow::Result<()> {
        Ok(())
    }
    fn handle_message(&mut self, _source: &Address, _message: String, _our: &Address) -> anyhow::Result<()> {
        Ok(())
    }
    fn handle_frontend_message(&mut self, _message: String, _our: &Address, _consumer: &Consumer) -> anyhow::Result<()> {
        // Add logic to handle frontend messages here
        Ok(())
    }

    fn handle_new_frontend(&mut self, _our: &Address, _consumer: &Consumer) -> anyhow::Result<()> {
        Ok(())
    }
}

pub fn get_now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

fn handle_websocket_push<T, U, V>(
    our: &Address,
    state: &mut ProviderState<T, U, V>,
    channel_id: u32,
    message_type: WsMessageType,
) -> anyhow::Result<()> 
where
    T: AppServiceState,
    U: AppClientState,
    V: AppProcessState,
{
    let Some(consumer) = state.consumers.get_mut(&channel_id) else {
        return Ok(());
    };
    consumer.last_active = get_now();
    if message_type == WsMessageType::Close {
        state.consumers.remove(&channel_id);
        return Ok(());
    }
    if message_type != WsMessageType::Binary {
        return Ok(());
    }
    let Some(blob) = get_blob() else {
        return Ok(());
    };

    let Ok(_s) = String::from_utf8(blob.bytes.clone()) else {
        return Ok(());
    };
    
    if let Ok(request) = serde_json::from_slice::<FrontendRequest>(&blob.bytes) {
        match request {
            FrontendRequest::Meta(m_req) => {
                match m_req {
                    FrontendMetaRequest::Unsubscribe => {
                        let Some(sid) = consumer.service_id.clone() else {
                            return Ok(());
                        };
                        if !state.clients.contains_key(&sid) {
                            return Ok(());
                        };

                        let Some(service_id) = ServiceID::from_string(sid.as_str()) else {
                            return Ok(());
                        };

                        // TODO possibly delete client?
                        // TODO possibly set consumer.service_id back to None?
                        if let Some(mut client_wrapper) = state.clients.remove(&sid) {
                            if let Some(service_id) = ServiceID::from_string(sid.as_str()) {
                                // Call client.kill()
                                client_wrapper.state.kill(our, &client_wrapper.client)?;
                            }
                        }

                        poke(&service_id.address, ProviderInput::ProviderServiceInput(sid, ProviderServiceInput::Unsubscribe))?;
                    }
                    FrontendMetaRequest::SetService(sid) => {
                        if let Some(service_id) = ServiceID::from_string(&sid) {
                            consumer.service_id = Some(sid.clone());
                            if !state.clients.contains_key(&sid) {
                                let client = Client {
                                    id: service_id.clone(),
                                    meta: None,
                                    last_visited: get_now(),
                                    last_heard_from_host: None,
                                };
                                state.clients.insert(sid.clone(), AppClientStateWrapper { client, state: U::new() });
                            }
                            poke(&service_id.address, ProviderInput::ProviderServiceInput(sid, ProviderServiceInput::Subscribe))?;
                        } else {
                            // bad service id
                            // should probably notify frontend of this failure case
                        }
                    }
                    FrontendMetaRequest::RequestMyServices => {
                        let services: Vec<Service> = state.services.values()
                            .map(|wrapper| wrapper.service.clone())
                            .collect();
                        let response_message = FrontendUpdate::Meta(FrontendMetaUpdate::MyServices(services));
                        update_consumer(channel_id, response_message)?;
                    }
                    FrontendMetaRequest::CreateService(options) => {
                        let mut service = Service::new(&options.service_name, our.clone());
                        service.meta.access = options.access;
                        service.meta.visibility = options.visibility;
                        service.meta.whitelist = options.whitelist.into_iter().collect();
                        service.meta.title = options.title;
                        service.meta.description = options.description;
                        service.meta.publish_user_presence = options.publish_user_presence;
                        service.meta.publish_subscribers = options.publish_subscribers;
                        service.meta.publish_subscriber_count = options.publish_subscriber_count;
                        service.meta.publish_whitelist = options.publish_whitelist;
                        let mut service_state = T::new();
                        service_state.init(our, &service)?;
                        state.services.insert(service.id.to_string(), AppServiceStateWrapper {
                            service: service.clone(),
                            state: service_state,
                        });
                        let req = ProviderOutput::Service(service);
                        poke(&get_server_address(&our.node), req)?;
                        let services: Vec<Service> = state.services.values()
                            .map(|wrapper| wrapper.service.clone())
                            .collect();
                        let response_message = FrontendUpdate::Meta(FrontendMetaUpdate::MyServices(services));
                        update_consumer(channel_id, response_message)?;
                    }
                    FrontendMetaRequest::DeleteService(service_id_string) => {
                        if let Some(mut service) = state.services.remove(&service_id_string) {
                            service.state.kill(our, &service.service)?;
                            let service_id = service.service.id.to_string();
                            
                            // Notify dartfrog about the deletion
                            let req = ProviderOutput::DeleteService(service.service.id);
                            poke(&get_server_address(&our.node), req)?;
                            
                            // Notify all consumers about the updated service list
                            let services: Vec<Service> = state.services.values()
                                .map(|wrapper| wrapper.service.clone())
                                .collect();
                            let response_message = FrontendUpdate::Meta(FrontendMetaUpdate::MyServices(services));
                            update_all_consumers(state, response_message)?;
                            
                            // Notify local consumers about the service deletion
                            let kick_message = FrontendUpdate::Channel(FrontendChannelUpdate::Kick(KickReason::ServiceDeleted));
                            update_all_consumers_with_service_id(state, service_id.clone(), kick_message)?;
                            
                            // Notify remote subscribers about the service deletion
                            for subscriber in service.service.meta.subscribers {
                                let subscriber_address = Address {
                                    node: subscriber,
                                    process: our.process.clone(),
                                };
                                let kick_request = ProviderInput::ProviderUserInput(
                                    service_id.clone(),
                                    ProviderUserInput::FromService(UpdateFromService::Kick(KickReason::ServiceDeleted))
                                );
                                poke(&subscriber_address, kick_request)?;
                            }
                        }
                    }
                    FrontendMetaRequest::EditService(service_id_string, options) => {
                        if let Some(service_wrapper) = state.services.get_mut(&service_id_string) {
                            let service = &mut service_wrapper.service;
                            
                            // Update service metadata
                            if let Some(access) = options.access {
                                service.meta.access = access;
                            }
                            if let Some(visibility) = options.visibility {
                                service.meta.visibility = visibility;
                            }
                            if let Some(whitelist) = options.whitelist {
                                service.meta.whitelist = whitelist.into_iter().collect();
                            }
                            if let Some(title) = options.title {
                                service.meta.title = Some(title);
                            }
                            if let Some(description) = options.description {
                                service.meta.description = Some(description);
                            }
                            if let Some(publish_user_presence) = options.publish_user_presence {
                                service.meta.publish_user_presence = publish_user_presence;
                            }
                            if let Some(publish_subscribers) = options.publish_subscribers {
                                service.meta.publish_subscribers = publish_subscribers;
                            }
                            if let Some(publish_subscriber_count) = options.publish_subscriber_count {
                                service.meta.publish_subscriber_count = publish_subscriber_count;
                            }
                            if let Some(publish_whitelist) = options.publish_whitelist {
                                service.meta.publish_whitelist = publish_whitelist;
                            }

                            // Notify dartfrog about the changes
                            let req = ProviderOutput::Service(service.clone());
                            poke(&get_server_address(&our.node), req)?;

                            // Publish updated metadata to all subscribers
                            publish_metadata(our, service)?;
                        }
                        let services: Vec<Service> = state.services.values()
                            .map(|wrapper| wrapper.service.clone())
                            .collect();
                        let response_message = FrontendUpdate::Meta(FrontendMetaUpdate::MyServices(services));
                        update_all_consumers(state, response_message)?;
                    }
                    FrontendMetaRequest::RequestPeer(node) => {
                        let req = ProviderOutput::RequestPeer(node);
                        poke(&get_server_address(&our.node), req)?;
                    }
                    FrontendMetaRequest::RequestPeerList(node_list) => {
                        let req = ProviderOutput::RequestPeerList(node_list);
                        poke(&get_server_address(&our.node), req)?;
                    }
                    FrontendMetaRequest::RequestKnownPeers => {
                        let req = ProviderOutput::RequestKnownPeers;
                        poke(&get_server_address(&our.node), req)?;
                    }
                    FrontendMetaRequest::MessageProcess(msg) => {
                        state.process.handle_frontend_message(msg, our, consumer)?;
                    }
                }
            }
            FrontendRequest::Channel(s_req) => {
                let Some(service_id_string) = &consumer.service_id else {
                    return Ok(())
                };
                let Some(service_id) =  ServiceID::from_string(service_id_string) else {
                    return Ok(())
                };
                match s_req {
                    FrontendChannelRequest::Heartbeat => {
                        poke(
                            &service_id.address,
                            ProviderInput::ProviderServiceInput(
                                service_id_string.clone(),
                                ProviderServiceInput::Heartbeat
                            )
                        )?;

                        // Notify the server about frontend activity
                        poke(
                            &get_server_address(&our.node),
                            ProviderOutput::FrontendActivity
                        )?;
                    }
                    FrontendChannelRequest::MessageClient(msg) => {
                        if let Some(cw) = state.clients.get_mut(service_id_string) {
                            cw.state.handle_frontend_message(msg, our, &cw.client, consumer)?;
                        }
                    }
                    FrontendChannelRequest::MessageServer(msg) => {
                        poke(
                            &service_id.address,
                            ProviderInput::ProviderServiceInput(
                                service_id_string.clone(),
                                ProviderServiceInput::AppMessage(msg)
                            )
                        )?;
                    }
                }
            }
        }
    }
    Ok(())
}

pub fn handle_provider_http<T, U, V>(
    our: &Address,
    state: &mut ProviderState<T, U, V>,
    source: &Address,
    body: &[u8],
) -> anyhow::Result<()>
where
    T: AppServiceState,
    U: AppClientState,
    V: AppProcessState,
{
    let Ok(server_request) = serde_json::from_slice::<HttpServerRequest>(body) else {
        // Fail silently if we can't parse the request
        return Ok(());
    };

    // take the opportunity to kill any old consumers
    // TODO this is weird if the calling consumer times out
    state.consumers.retain(|_, consumer| {
        get_now() - consumer.last_active <= CONSUMER_TIMEOUT
    });

    match server_request {
        HttpServerRequest::WebSocketOpen { channel_id, .. } => {
            let consumer = Consumer::new(channel_id);
            state.consumers.insert(channel_id, consumer.clone());
            state.process.handle_new_frontend(our, &consumer)?;

        }
        HttpServerRequest::WebSocketPush { channel_id, message_type} => {
            if let Err(e) = handle_websocket_push(our, state, channel_id, message_type) {
                println!("Error handling WebSocket push: {:?}", e);
            }        }
        HttpServerRequest::WebSocketClose(channel_id) => {
            state.consumers.remove(&channel_id);
        }
        _ => {
        }
    };

    Ok(())
}

pub fn update_consumer (
    websocket_id: u32,
    update: FrontendUpdate,
) -> anyhow::Result<()> {

    let blob = LazyLoadBlob {
        mime: Some("application/json".to_string()),
        bytes: serde_json::json!(update)
        .to_string()
        .as_bytes()
        .to_vec(),
    };

    send_ws_push(
        websocket_id,
        WsMessageType::Text,
        blob,
    );
    Ok(())
}

fn update_all_consumers_with_service_id<T, U, V>(
    state: &ProviderState<T, U, V>,
    service_id: String,
    update: FrontendUpdate,
) -> anyhow::Result<()> 
where
    T: AppServiceState,
    U: AppClientState,
{
    for (&websocket_id, consumer) in &state.consumers {
        if consumer.service_id == Some(service_id.clone()) {
            update_consumer(websocket_id, update.clone())?;
        }
    }
    Ok(())
}

fn update_all_consumers<T, U, V>(
    state: &ProviderState<T, U, V>,
    update: FrontendUpdate,
) -> anyhow::Result<()>
where
    T: AppServiceState,
    U: AppClientState,
{
    for (&websocket_id, _) in &state.consumers {
        update_consumer(websocket_id, update.clone())?;
    }
    Ok(())
}

pub fn update_consumer_from_process<T: Serialize>(consumer: &Consumer, update: T) -> anyhow::Result<()> {
    let serialized = serde_json::to_string(&update)?;
    let frontend_update = FrontendUpdate::Meta(FrontendMetaUpdate::FromProcess(serialized));
    update_consumer(consumer.ws_channel_id, frontend_update)
}

pub fn handle_dartfrog_to_provider<T, U, V>(our: &Address, state: &mut ProviderState<T, U, V>, source: &Address, app_message: DartfrogToProvider) -> anyhow::Result<()> 
where
    T: AppServiceState,
    U: AppClientState,
    V: AppProcessState,
{
    match app_message {
        DartfrogToProvider::CreateService(options) => {
            if source != &get_server_address(&our.node) {
                return Ok(());
            }
            let mut service = Service::new(&options.service_name, our.clone());
            service.meta.access = options.access;
            service.meta.visibility = options.visibility;
            service.meta.whitelist = options.whitelist.into_iter().collect();
            service.meta.title = options.title;
            service.meta.description = options.description;
            service.meta.publish_user_presence = options.publish_user_presence;
            service.meta.publish_subscribers = options.publish_subscribers;
            service.meta.publish_subscriber_count = options.publish_subscriber_count;
            service.meta.publish_whitelist = options.publish_whitelist;
            state.services.insert(service.id.to_string(), AppServiceStateWrapper {
                service: service.clone(),
                state: T::new(),
            });

            // notify dartfrog
            let req = ProviderOutput::Service(service);
            poke(&get_server_address(&our.node), req)?;
        }
        DartfrogToProvider::EditService(id, options) => {
            if source != &get_server_address(&our.node) {
                return Ok(());
            }
            if let Some(mut service_wrapper) = state.services.get_mut(&id) {
                let service = &mut service_wrapper.service;
                if let Some(title) = options.title {
                    service.meta.title = Some(title);
                }
                if let Some(description) = options.description {
                    service.meta.description = Some(description);
                }
                if let Some(access) = options.access {
                    service.meta.access = access;
                }
                if let Some(visibility) = options.visibility {
                    service.meta.visibility = visibility;
                }
                if let Some(whitelist) = options.whitelist {
                    service.meta.whitelist = whitelist.into_iter().collect();
                }
                if let Some(publish_user_presence) = options.publish_user_presence {
                    service.meta.publish_user_presence = publish_user_presence;
                }
                if let Some(publish_subscribers) = options.publish_subscribers {
                    service.meta.publish_subscribers = publish_subscribers;
                }
                if let Some(publish_subscriber_count) = options.publish_subscriber_count {
                    service.meta.publish_subscriber_count = publish_subscriber_count;
                }
                if let Some(publish_whitelist) = options.publish_whitelist {
                    service.meta.publish_whitelist = publish_whitelist;
                }

                // Notify dartfrog about the changes
                let req = ProviderOutput::Service(service.clone());
                poke(&get_server_address(&our.node), req)?;

                // Notify all consumers about the updated service
                let services: Vec<Service> = state.services.values()
                    .map(|wrapper| wrapper.service.clone())
                    .collect();
                let response_message = FrontendUpdate::Meta(FrontendMetaUpdate::MyServices(services));
                update_all_consumers(state, response_message)?;
            }
        }
        DartfrogToProvider::DeleteService(service_id) => {
            if source != &get_server_address(&our.node) {
                return Ok(());
            }
            if let Some(service) = state.services.remove(&service_id) {
                let req = ProviderOutput::DeleteService(service.service.id);
                poke(&get_server_address(&our.node), req)?;
            } else {
            }
        }
        DartfrogToProvider::Peer(peer) => {
            if source != &get_server_address(&our.node) {
                return Ok(());
            }
            let update = FrontendUpdate::Meta(FrontendMetaUpdate::Peer(peer));
            update_all_consumers(state, update)?;
        }
        DartfrogToProvider::PeerList(peers) => {
            if source != &get_server_address(&our.node) {
                return Ok(());
            }
            let update = FrontendUpdate::Meta(FrontendMetaUpdate::PeerList(peers));
            update_all_consumers(state, update)?;
        }
    }
    Ok(())
}

pub fn poke_client(source: &Address, service_id: String, client_request: UpdateFromService) -> anyhow::Result<()> {
    poke(source, ProviderInput::ProviderUserInput(
        service_id,
        ProviderUserInput::FromService(client_request)
    ))?;
    Ok(())
}

fn kick_inactive_users(service: &mut Service, source: &Address, service_id: String) -> anyhow::Result<()> {
    let now = get_now();
    let mut to_kick: HashSet<String> = HashSet::new();
    
    for (user, presence_time) in service.meta.user_presence.iter() {
        const THREE_MINUTES: u64 = 3 * 60;
        if (now - *presence_time) > THREE_MINUTES {
            to_kick.insert(user.clone());
        }
    }

    for user in service.meta.subscribers.iter() {
        if to_kick.contains(user) {
            let update = UpdateFromService::Kick(KickReason::ServiceDeleted);
            poke_client(source, service_id.clone(), update)?;
        }
    }
    
    service.meta.subscribers.retain(|x| !to_kick.contains(x));

    Ok(())
}

pub fn handle_provider_input<T, U, V>(
    our: &Address,
    state: &mut ProviderState<T, U, V>,
    source: &Address,
    request: ProviderInput,
) -> anyhow::Result<()> 
where
    T: AppServiceState,
    U: AppClientState,
    V: AppProcessState,
{
    match request {
        ProviderInput::DartfrogRequest(df_req) => {
            handle_dartfrog_to_provider(our, state, source, df_req)?;
        }
        ProviderInput::ProviderUserInput(service_id, user_input) => {
            let Some(mut client_wrapper) = state.clients.get_mut(&service_id) else {
                // println!("Client with id {} does not exist", service_id);
                return Ok(());
            };
            let client = &mut client_wrapper.client;
            match user_input {
                ProviderUserInput::FromFrontend(message) => {
                    // TODO remove?
                    // println!("Received message from frontend: {}", message);
                }
                ProviderUserInput::FromService(from_service_req) => {
                    let Some(parsed_service_id) = ServiceID::from_string(service_id.as_str()) else {
                        return Ok(());
                    };
                    if source != &parsed_service_id.address {
                        return Ok(());
                    }
                    match from_service_req {
                        UpdateFromService::SubscribeAck => {
                            let update = FrontendUpdate::Channel(
                                FrontendChannelUpdate::SubscribeAck,
                            );
                            update_all_consumers_with_service_id(state, service_id, update)?;
                        }
                        UpdateFromService::SubscribeNack(nack) => {
                            let update = FrontendUpdate::Channel(
                                FrontendChannelUpdate::SubscribeNack(nack),
                            );
                            update_all_consumers_with_service_id(state, service_id, update)?;
                        }
                        UpdateFromService::PublicMetadata(meta) => {
                            client.meta = Some(meta.clone());
                            let update = FrontendUpdate::Channel(
                                FrontendChannelUpdate::PublicMetadata(meta)
                            );
                            update_all_consumers_with_service_id(state, service_id, update)?;
                        }
                        UpdateFromService::Metadata(meta) => {
                            let update = FrontendUpdate::Channel(
                                FrontendChannelUpdate::Metadata(meta)
                            );
                            update_all_consumers_with_service_id(state, service_id, update)?;
                        }
                        UpdateFromService::Kick(kick_reason) => {
                            let update = FrontendUpdate::Channel(
                                FrontendChannelUpdate::Kick(kick_reason)
                            );
                            update_all_consumers_with_service_id(state, service_id, update)?;

                        }
                        UpdateFromService::AppMessageToFrontend(app_message) => {
                            let update: FrontendUpdate = FrontendUpdate::Channel(
                                FrontendChannelUpdate::FromServer(app_message)
                            );
                            update_all_consumers_with_service_id(state, service_id, update)?;
                            
                        }
                        UpdateFromService::AppMessageToClient(app_message) => {
                            client_wrapper.state.handle_service_message(
                                app_message,
                                our,
                                client,
                            )?;
                        }

                    }

                }
                ProviderUserInput::FromClient(from_client_req) => {
                    let Some(parsed_service_id) = ServiceID::from_string(service_id.as_str()) else {
                        return Ok(());
                    };
                    if source != &parsed_service_id.address {
                        return Ok(());
                    }
                    match from_client_req {
                        UpdateFromClient::AppMessageToFrontend(app_message) => {
                            let update: FrontendUpdate = FrontendUpdate::Channel(
                                FrontendChannelUpdate::FromClient(app_message)
                            );
                            update_all_consumers_with_service_id(state, service_id, update)?;
                        }
                    }
                }
            }
        }
        ProviderInput::ProviderServiceInput(service_id, service_request) => {
            let Some(sw) = state.services.get_mut(&service_id) else {
                // println!("Service with id {} does not exist", service_id);
                match service_request {
                    ProviderServiceInput::Subscribe => {
                        poke_client(source, service_id.clone(), UpdateFromService::SubscribeNack(SubscribeNack::ServiceDoesNotExist))?;
                        
                    }
                    _ => {

                    }
                }
                return Ok(());
            };
            match service_request {
                ProviderServiceInput::Subscribe => {
                    if check_subscribe_permission(&sw.service, &source.clone()) {
                        // println!("Service {} subscribed", service_id);
                        sw.service.meta.subscribers.insert(source.node.clone());
                        sw.service.meta.user_presence.insert(source.node.clone(), get_now());
                        sw.service.meta.last_sent_presence = Some(get_now());
                        kick_inactive_users(&mut sw.service, source, service_id.clone())?;
                        poke_client(source, service_id, UpdateFromService::SubscribeAck)?;
                        publish_metadata(our, &sw.service)?;
                        sw.state.handle_subscribe(source.node.clone(), our, &sw.service)?;
                    } else {
                        poke_client(source, service_id.clone(), UpdateFromService::SubscribeNack(SubscribeNack::Unauthorized))?;
                    }
                }
                ProviderServiceInput::Unsubscribe => {
                    // println!("Service {} unsubscribed", service_id);
                    if sw.service.meta.subscribers.contains(&source.node) {
                        sw.service.meta.subscribers.remove(&source.node);
                        publish_metadata(our, &sw.service)?;
                        sw.state.handle_unsubscribe(source.node.clone(), our, &sw.service)?;
                    }
                }
                ProviderServiceInput::Heartbeat => {
                    if !sw.service.meta.subscribers.contains(&source.node) {
                        // not subscribed, ignore
                        return Ok(());
                    }
                    sw.service.meta.user_presence.insert(source.node.clone(), get_now());
                    let now = get_now();
                    if let Some(last_sent) = sw.service.meta.last_sent_presence {
                        if (now - last_sent) < 1 * 60 {
                            // "regular metadata updates"
                            // these are evoked by client heartbeats, but only sent up to a capped rate
                            return Ok(());
                        }
                    }

                    kick_inactive_users(&mut sw.service, source, service_id)?;

                    // send metadata update
                    sw.service.meta.last_sent_presence = Some(get_now());
                    publish_metadata(our, &sw.service)?;
                }
                ProviderServiceInput::AppMessage(message) => {
                    sw.state.handle_request(source.node.clone(), message, our, &sw.service)?;
                }
            }
        }
    }
    Ok(())
}

pub fn app_client_to_frontend(
    our: &Address,
    message: impl Serialize,
    client: &Client,
) -> anyhow::Result<()> {
    let message_str = serde_json::to_string(&message)?;
    let req = ProviderInput::ProviderUserInput(
        client.id.to_string(),
        ProviderUserInput::FromClient(UpdateFromClient::AppMessageToFrontend(message_str)),
    );
    poke(our, req)?;
    Ok(())
}

pub fn app_service_to_client_frontend(
    our: &Address,
    update: impl Serialize,
    service: &Service,
    subscriber: &String,
) -> anyhow::Result<()> {
    let update_str = serde_json::to_string(&update)?;
    let address = Address {
        node: subscriber.clone(),
        process: our.process.clone(),
    };
    let req = ProviderInput::ProviderUserInput(
        service.id.to_string(),
        ProviderUserInput::FromService(UpdateFromService::AppMessageToFrontend(update_str)),
    );
    poke(&address, req)?;
    Ok(())
}

fn app_service_to_client(
    our: &Address,
    update: impl Serialize,
    service: &Service,
    subscriber: &String,
) -> anyhow::Result<()> {
    let update_str = serde_json::to_string(&update)?;
    let address = Address {
        node: subscriber.clone(),
        process: our.process.clone(),
    };
    let req = ProviderInput::ProviderUserInput(
        service.id.to_string(),
        ProviderUserInput::FromService(UpdateFromService::AppMessageToClient(update_str)),
    );
    poke(&address, req)?;
    Ok(())
}

fn app_service_to_all_client_frontends(
    our: &Address,
    update: impl Serialize,
    service: &Service,
) -> anyhow::Result<()> {
    for subscriber in &service.meta.subscribers {
        app_service_to_client_frontend(our, &update, service, subscriber)?;
    }
    Ok(())
}

fn app_service_to_all_clients(
    our: &Address,
    update: impl Serialize,
    service: &Service,
) -> anyhow::Result<()> {
    for subscriber in &service.meta.subscribers {
        app_service_to_client(our, &update, service, subscriber)?;
    }
    Ok(())
}

pub fn update_subscriber(update: impl Serialize, subscriber: &String, our: &Address, service: &Service) -> anyhow::Result<()> {
    app_service_to_client_frontend(our, update, service, subscriber)
}
pub fn update_subscriber_client(update: impl Serialize, subscriber: &String, our: &Address, service: &Service) -> anyhow::Result<()> {
    app_service_to_client(our, update, service, subscriber)
}

pub fn update_subscribers(update: impl Serialize, our: &Address, service: &Service) -> anyhow::Result<()> {
    app_service_to_all_client_frontends(our, update, service)
}

pub fn update_subscriber_clients(our: &Address, update: impl Serialize, service: &Service) -> anyhow::Result<()> {
    app_service_to_all_clients(our, update, service)
}

pub fn publish_metadata(our: &Address, service: &Service) -> anyhow::Result<()> {
    // send to dartfrog
    poke(&get_server_address(&our.node), ProviderOutput::Service(service.clone()))?;
    
    // Construct PublicServiceMetadata
    let public_meta = PublicServiceMetadata {
        title: service.meta.title.clone(),
        description: service.meta.description.clone(),
        last_sent_presence: service.meta.last_sent_presence,
        subscribers: if service.meta.publish_subscribers {
            Some(service.meta.subscribers.clone())
        } else {
            None
        },
        subscriber_count: if service.meta.publish_subscriber_count {
            Some(service.meta.subscribers.len() as u64)
        } else {
            None
        },
        user_presence: if service.meta.publish_user_presence {
            Some(service.meta.user_presence.clone())
        } else {
            None
        },
        access: service.meta.access.clone(),
        visibility: service.meta.visibility.clone(),
        whitelist: if service.meta.publish_whitelist {
            Some(service.meta.whitelist.clone())
        } else {
            None
        },
    };

    // send to all clients
    for client in service.meta.subscribers.iter() {
        let req = ProviderInput::ProviderUserInput(
            service.id.to_string(),
            ProviderUserInput::FromService(
                UpdateFromService::PublicMetadata(public_meta.clone())
            )
        );
        let address = Address {
            node: client.clone(),
            process: our.process.clone(),
        };
        poke(&address, req)?;

         // If the client is the host, also send the full Metadata
         if client == &service.id.address.node {
            let host_req = ProviderInput::ProviderUserInput(
                service.id.to_string(),
                ProviderUserInput::FromService(
                    UpdateFromService::Metadata(service.meta.clone())
                )
            );
            poke(&address, host_req)?;
        }
    }    
    Ok(())
}

pub fn provider_handle_message<T, U, V>(our: &Address, state: &mut ProviderState<T, U, V>) -> anyhow::Result<()>
where
    T: AppServiceState,
    U: AppClientState,
    V: AppProcessState,
{
    let message = await_message()?;

    if !message.is_request() {
        // Handle timer response
        if message.source().process == "timer:distro:sys" {
            // Check if any service has subscribers
            let has_subscribers = state.services.values().any(|s| !s.service.meta.subscribers.is_empty());
            
            if has_subscribers {
                // Perform timer-based actions here
                for (service_id, service_wrapper) in state.services.iter_mut() {
                    let now = get_now();
                    let mut inactive_subscribers = Vec::new();

                    for (subscriber, last_active) in &service_wrapper.service.meta.user_presence {
                        if service_wrapper.service.meta.subscribers.contains(subscriber) && now - last_active > 3 * 60 {
                            inactive_subscribers.push(subscriber.clone());
                        }
                    }

                    for inactive_subscriber in inactive_subscribers.clone() {
                        service_wrapper.service.meta.subscribers.remove(&inactive_subscriber);

                        // Notify the kicked subscriber
                        let kick_reason = KickReason::Custom("Inactivity".to_string());
                        let update = UpdateFromService::Kick(kick_reason);
                        let _ = poke_client(&get_process_address(&inactive_subscriber, PROCESS_NAME), service_id.clone(), update);
                    }

                    if !inactive_subscribers.is_empty() {
                        // Update metadata if any subscribers were kicked
                        let _ = publish_metadata(our, &service_wrapper.service);
                    }
                }
                set_timer(60000, None);
            } else {
                // if there are no subscribers, turn off the timer.
                state.timer_active = false;
            }
            state.save(our)?;
            return Ok(());
        }
        return Err(anyhow::anyhow!("unexpected Response: {:?}", message));
    }

    let body = message.body();
    let source = message.source();
    
    if message.source().node == our.node && message.source().process == "http_server:distro:sys" {
        handle_provider_http(our, state, source, body)?;
    } else if let Ok(provider_input) = serde_json::from_slice::<ProviderInput>(&body) {
        handle_provider_input(our, state, source, provider_input)?;
        
        // make sure timer is running if has subscibers
        let has_subscribers = state.services.values().any(|s| !s.service.meta.subscribers.is_empty());
        if has_subscribers && !state.timer_active {
            
            set_timer(60000, None);
            state.timer_active = true;
        }
    }

    Ok(())
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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DefaultAppServiceState;

impl AppServiceState for DefaultAppServiceState {
    fn new() -> Self {
        DefaultAppServiceState
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DefaultAppClientState;

impl AppClientState for DefaultAppClientState {
    fn new() -> Self {
        DefaultAppClientState
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DefaultAppProcessState;

impl AppProcessState for DefaultAppProcessState {
    fn new() -> Self {
        DefaultAppProcessState
    }
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChatUpdate {
    Message(ChatMessage),
    FullMessageHistory(Vec<ChatMessage>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WrapChatUpdate {
    Chat(ChatUpdate),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: u64,
    pub time: u64,
    pub from: String,
    pub msg: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChatRequest {
    SendMessage(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatServiceState {
    pub last_message_id: u64,
    pub messages: Vec<ChatMessage>,
}

impl ChatServiceState {
    pub fn new() -> Self {
        ChatServiceState {
            last_message_id: 0,
            messages: Vec::new(),
        }
    }

    pub fn handle_subscribe(&self, subscriber_node: String, our: &Address, service: &Service) -> anyhow::Result<()> {
        let chat_history = ChatUpdate::FullMessageHistory(self.messages.clone());
        let update = WrapChatUpdate::Chat(chat_history);
        update_subscriber(update, &subscriber_node, our, service)?;
        Ok(())
    }

    pub fn handle_request(&mut self, from: String, req: ChatRequest, our: &Address, service: &Service) -> anyhow::Result<()> {
        match req {
            ChatRequest::SendMessage(msg) => {
                const MAX_CHAT_MESSAGE_LENGTH: usize = 2048;
                let msg = if msg.len() > MAX_CHAT_MESSAGE_LENGTH {
                    msg[..MAX_CHAT_MESSAGE_LENGTH].to_string()
                } else {
                    msg
                };

                let chat_msg = ChatMessage {
                    id: self.last_message_id,
                    time: get_now(),
                    from: from.clone(),
                    msg: msg,
                };

                const MAX_CHAT_HISTORY: usize = 64;
                if self.messages.len() > MAX_CHAT_HISTORY {
                    self.messages = self.messages.split_off(self.messages.len() - MAX_CHAT_HISTORY);
                }

                self.last_message_id += 1;
                self.messages.push(chat_msg.clone());
                let chat_update = ChatUpdate::Message(chat_msg.clone());
                let update = WrapChatUpdate::Chat(chat_update);
                update_subscribers(update, our, service)?;
            }
        }
        Ok(())
    }
}