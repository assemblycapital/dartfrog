use kinode_process_lib::http::{send_ws_push, HttpServerRequest, WsMessageType};
use serde::{Serialize, Deserialize};

use std::collections::{HashMap, HashSet};
use std::str::FromStr;
use std::time::{SystemTime, UNIX_EPOCH};

use std::hash::{Hash, Hasher};
use kinode_process_lib::{await_message, get_blob, println, Address, LazyLoadBlob, ProcessId, Request};

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
    pub hosted_services: Vec<Service>,
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
pub enum DartfrogInput {
    CreateService(String, String),
    DeleteService(String),
    SetProfile(Profile),
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
    NodeList(Vec<String>),
    Node(String),
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
    CreateService(String),
    SetService(String),
    Unsubscribe,
    RequestPeer(String),
    RequestPeerList(Vec<String>),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum FrontendChannelRequest {
    Heartbeat,
    MessageClient(String),
    MessageServer(String)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum FrontendUpdate {
    Meta(FrontendMetaUpdate),
    Channel(FrontendChannelUpdate),
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum FrontendMetaUpdate {
    MyServices(Vec<String>),
    Peer(Peer),
    PeerList(Vec<Peer>),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum FrontendChannelUpdate {
    Metadata(ServiceMetadata),
    SubscribeAck,
    SubscribeNack(SubscribeNack),
    Kick(KickReason),
    FromServer(String),
    FromClient(String),
}


#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum DartfrogToProvider {
    CreateService(String), // service_name
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

const CONSUMER_TIMEOUT : u64 = 10*60; //10 minutes

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Client {
    pub id: ServiceID,
    pub meta: Option<ServiceMetadata>,
    pub last_visited: u64,
    pub last_heard_from_host: Option<u64>,
}


#[derive(Debug, Clone)]
pub struct ProviderState<T, U> 
where
    T: AppServiceState,
    U: AppClientState,
{
    pub services: HashMap<String, AppServiceStateWrapper<T>>,
    pub clients: HashMap<String, AppClientStateWrapper<U>>,
    pub consumers: HashMap<u32, Consumer>,
}

impl<T, U> ProviderState<T, U>
where
    T: AppServiceState,
    U: AppClientState,
{
    pub fn new() -> Self {
        ProviderState {
            services: HashMap::new(),
            clients: HashMap::new(),
            consumers: HashMap::new(),
        }
    }
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
pub trait AppServiceState: std::fmt::Debug {
    fn new() -> Self;
    fn handle_request(&mut self, from: String, req: String, our: &Address, service: &Service) -> anyhow::Result<()>;
    fn handle_subscribe(&mut self, from: String, our: &Address, service: &Service) -> anyhow::Result<()>;
    fn handle_unsubscribe(&mut self, from: String, our: &Address, service: &Service) -> anyhow::Result<()>;
}

pub trait AppClientState: std::fmt::Debug {
    fn new() -> Self;
    fn handle_service_message(&mut self, upd: String, our: &Address, client: &Client) -> anyhow::Result<()>;
    fn handle_frontend_message(&mut self, upd: String, our: &Address, client: &Client) -> anyhow::Result<()>;
    fn handle_new_frontend(&mut self, our: &Address, client: &Client) -> anyhow::Result<()>;
}

pub fn get_now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

fn handle_websocket_push<T, U>(
    our: &Address,
    state: &mut ProviderState<T, U>,
    channel_id: u32,
    message_type: WsMessageType,
) -> anyhow::Result<()> 
where
    T: AppServiceState,
    U: AppClientState,
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
                        let service_keys: Vec<String> = state.services.keys().map(|id| id.to_string()).collect();
                        let response_message = FrontendUpdate::Meta(FrontendMetaUpdate::MyServices(service_keys));
                        update_consumer(channel_id, response_message)?;
                    }
                    FrontendMetaRequest::CreateService(name) => {
                        let service = Service::new(&name, our.clone());
                        state.services.insert(service.id.to_string(), AppServiceStateWrapper {
                            service: service.clone(),
                            state: T::new(),
                        });
                        let req = ProviderOutput::Service(service);
                        poke(&get_server_address(&our.node), req)?;
                    }
                    FrontendMetaRequest::RequestPeer(node) => {
                        let req = ProviderOutput::RequestPeer(node);
                        poke(&get_server_address(&our.node), req)?;
                    }
                    FrontendMetaRequest::RequestPeerList(node_list) => {
                        let req = ProviderOutput::RequestPeerList(node_list);
                        poke(&get_server_address(&our.node), req)?;
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
                    }
                    FrontendChannelRequest::MessageClient(msg) => {
                        // TODO
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

pub fn handle_provider_http<T, U>(
    our: &Address,
    state: &mut ProviderState<T, U>,
    source: &Address,
    body: &[u8],
) -> anyhow::Result<()>
where
    T: AppServiceState,
    U: AppClientState,
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
            state.consumers.insert(channel_id, Consumer::new(channel_id));
        }
        HttpServerRequest::WebSocketPush { channel_id, message_type} => {
            handle_websocket_push(our, state, channel_id, message_type)?;
        }
        HttpServerRequest::WebSocketClose(channel_id) => {
            state.consumers.remove(&channel_id);
        }
        _ => {
        }
    };

    Ok(())
}

fn update_consumer (
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

fn update_all_consumers_with_service_id<T, U>(
    state: &ProviderState<T, U>,
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

fn update_all_consumers<T, U>(
    state: &ProviderState<T, U>,
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

pub fn handle_dartfrog_to_provider<T, U>(our: &Address, state: &mut ProviderState<T, U>, source: &Address, app_message: DartfrogToProvider) -> anyhow::Result<()> 
where
    T: AppServiceState,
    U: AppClientState,
{
    match app_message {
        DartfrogToProvider::CreateService(service_name) => {
            if source != &get_server_address(&our.node) {
                return Ok(());
            }
            let service = Service::new(&service_name, our.clone());
            state.services.insert(service.id.to_string(), AppServiceStateWrapper {
                service: service.clone(),
                state: T::new(),
            });

            // notify dartfrog
            let req = ProviderOutput::Service(service);
            poke(&get_server_address(&our.node), req)?;

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
            let update = FrontendUpdate::Meta(FrontendMetaUpdate::Peer(peer));
            update_all_consumers(state, update)?;
        }
        DartfrogToProvider::PeerList(peers) => {
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

pub fn handle_provider_input<T, U>(
    our: &Address,
    state: &mut ProviderState<T, U>,
    source: &Address,
    request: ProviderInput,
) -> anyhow::Result<()> 
where
    T: AppServiceState,
    U: AppClientState,
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
                        UpdateFromService::Metadata(meta) => {
                            client.meta = Some(meta.clone());
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
                        poke_client(source, service_id.clone(), UpdateFromService::SubscribeAck)?;
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
                        sw.service.meta.user_presence.remove(&source.node);
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

                    // check if anyone needs to be kicked
                    let mut to_kick: HashSet<String> = HashSet::new();
                    for (user, presence_time) in sw.service.meta.user_presence.iter() {
                        const THREE_MINUTES: u64 = 3 * 60;
                        if (now - *presence_time) > THREE_MINUTES {
                            to_kick.insert(user.clone());
                        }
                    }

                    for user in sw.service.meta.subscribers.iter() {
                        if to_kick.contains(user) {
                            let update = UpdateFromService::Kick(KickReason::ServiceDeleted);
                            poke_client(source, service_id.clone(), update)?;
                        }
                    }
                    sw.service.meta.subscribers.retain(|x| !to_kick.contains(x));

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
    
    // send to all clients
    for client in service.meta.subscribers.iter() {
        let req = ProviderInput::ProviderUserInput(
            service.id.to_string(),
            ProviderUserInput::FromService(
                UpdateFromService::Metadata(service.meta.clone())
            )
        );
        let address = Address {
            node: client.clone(),
            process: our.process.clone(),
        };
        poke(&address, req)?;
    }
    
    Ok(())
}

pub fn provider_handle_message<T, U>(our: &Address, state: &mut ProviderState<T, U>) -> anyhow::Result<()>
where
    T: AppServiceState,
    U: AppClientState,
{
    let message = await_message()?;

    let body = message.body();
    let source = message.source();

    if !message.is_request() {
        return Err(anyhow::anyhow!("unexpected Response: {:?}", message));
    }
    
    if message.source().node == our.node
    && message.source().process == "http_server:distro:sys" {
        handle_provider_http(our, state, source, body)?;
    } else {
        if let Ok(provider_input) = serde_json::from_slice::<ProviderInput>(&body) {
            handle_provider_input(our, state, source, provider_input)?;
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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DefaultAppClientState;

impl AppClientState for DefaultAppClientState {
    fn new() -> Self {
        DefaultAppClientState
    }

    fn handle_service_message(&mut self, _upd: String, _our: &Address, _client: &Client) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_frontend_message(&mut self, _upd: String, _our: &Address, _client: &Client) -> anyhow::Result<()> {
        Ok(())
    }

    fn handle_new_frontend(&mut self, _our: &Address, _client: &Client) -> anyhow::Result<()> {
        Ok(())
    }
}
