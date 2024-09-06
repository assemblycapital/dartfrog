use std::collections::{HashMap, HashSet};
use std::str::FromStr;
use std::time::{SystemTime, UNIX_EPOCH};
use std::hash::{Hash, Hasher};

use dartfrog_lib::*;
mod constants;
use kinode_process_lib::{http, await_message, call_init, println, Address, Request,
    get_blob,
    LazyLoadBlob,
    http::{
        send_ws_push, HttpServerRequest,
        WsMessageType,
    },
    set_state, get_typed_state,
};
use serde::{Deserialize, Serialize};

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Consumer {
    pub ws_channel_id: u32,
    pub last_active: u64,
}

impl Consumer {
    pub fn new(id:u32) -> Self {
        Consumer {
            ws_channel_id: id,
            last_active: get_now(),
        }
    }
}
impl Hash for Consumer{
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.ws_channel_id.hash(state);
    }
}

const IS_FAKE: bool = !cfg!(feature = "prod");
const NETWORK_HUB: &str = if IS_FAKE { "fake.dev" } else { "waterhouse.os" };


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DartfrogState {
    pub network_hub: Option<String>,
    pub consumers: HashMap<u32, Consumer>,
    pub provider_consumers: HashMap<Address, Consumer>,
    pub local_services: HashMap<String, Service>,
    pub peers: HashMap<String, Peer>,
    pub profile: Profile,
    pub activity_setting: ActivitySetting,
    pub activity: PeerActivity,
    pub messages: HashMap<String, MessageStore>,
    pub rumors: Vec<String>,
}

impl DartfrogState {
    pub fn new(our: &Address) -> Self {
        DartfrogState {
            network_hub: None,
            consumers: HashMap::new(),
            provider_consumers: HashMap::new(),
            local_services: HashMap::new(),
            peers: HashMap::new(),
            profile : Profile::new(our.node.clone()),
            activity_setting: ActivitySetting::Public,
            activity: PeerActivity::Offline(get_now()),
            messages: HashMap::new(),
            rumors: vec!(),
        }
    }

    pub fn save(&self) {
        set_state(&bincode::serialize(self).unwrap());
    }

    pub fn load(our: &Address) -> Self {
        match get_typed_state(|bytes| Ok(bincode::deserialize::<DartfrogState>(bytes)?)) {
            Some(state) => state,
            None => DartfrogState::new(our)
        }
    }
}

const CONSUMER_TIMEOUT : u64 = 10*60; //10 minutes

fn update_consumer (
    websocket_id: u32,
    update: DartfrogOutput,
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

fn update_all_of_new_peer(
    state: &DartfrogState,
    peer: Peer,
) -> anyhow::Result<()> {
    for consumer in state.consumers.values() {
        update_consumer(consumer.ws_channel_id, DartfrogOutput::Peer(peer.clone()))?;
    }
    for address in state.provider_consumers.keys() {
        let req = ProviderInput::DartfrogRequest(DartfrogToProvider::Peer(peer.clone()));
        poke(address, req)?;
    }
    Ok(())
}

fn update_all_consumers(
    state: &DartfrogState,
    update: DartfrogOutput,
) -> anyhow::Result<()> {
    for consumer in state.consumers.values() {
        update_consumer(consumer.ws_channel_id, update.clone())?;
    }
    Ok(())
}

fn update_provider_consumer(
    source: &Address,
    state: &mut DartfrogState,
    update: DartfrogToProvider,
) -> anyhow::Result<()> {
    let req = ProviderInput::DartfrogRequest(update);
    poke(source, req)?;
    Ok(())
}

fn handle_http_server_request(
    our: &Address,
    state: &mut DartfrogState,
    source: &Address,
    body: &[u8],
) -> anyhow::Result<()> {

    let Ok(server_request) = serde_json::from_slice::<HttpServerRequest>(body) else {
        // Fail silently if we can't parse the request
        return Ok(());
    };

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    match server_request {
        HttpServerRequest::WebSocketOpen { channel_id, .. } => {
            state.consumers.insert(
                channel_id,
                Consumer {
                    ws_channel_id: channel_id,
                    last_active: now,
                },
            );
            state.activity = PeerActivity::Online(get_now());
            let my_peer_data = PeerData {
                profile: state.profile.clone(),
                hosted_services: state.local_services.values()
                    .filter(|service| matches!(service.meta.visibility, ServiceVisibility::Visible))
                    .map(|service| service.clone().to_public())
                    .collect(),
                activity: state.activity.clone(),
            };
            state.peers.insert(our.node.clone(), Peer {
                node: our.node.clone(),
                peer_data: Some(my_peer_data),
                outstanding_request: None,
                last_updated: Some(get_now()),
            });
            let services: Vec<Service> = state.local_services.values().cloned().collect();
            update_consumer(channel_id, DartfrogOutput::LocalServiceList(services))?;
            let peers: Vec<Peer> = state.peers.values().cloned().collect();
            update_consumer(channel_id, DartfrogOutput::PeerList(peers))?;
            let messages : Vec<MessageStore> = state.messages.values().cloned().collect();
            update_consumer(channel_id, DartfrogOutput::MessageStoreList(messages))?;
            let local_user = DartfrogOutput::LocalUser(state.profile.clone(), state.activity.clone(), state.activity_setting.clone());
            update_consumer(channel_id, local_user)?;
            state.save(); // Save after adding a new consumer
        }
        HttpServerRequest::WebSocketPush { channel_id, message_type} => {
            // take the opportunity to kill any old consumers
            // TODO this is weird if the calling consumer times out
            state.consumers.retain(|_, consumer| {
                get_now() - consumer.last_active <= CONSUMER_TIMEOUT
            });
            state.activity = PeerActivity::Online(get_now());

            if message_type == WsMessageType::Close {
                state.consumers.remove(&channel_id);
                state.save(); // Save after removing a consumer
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

            match serde_json::from_slice(&blob.bytes)? {
                DartfrogInput::RequestVersion => {
                    let network_hub_address = get_server_address(NETWORK_HUB);
                    poke(&network_hub_address, VersionControl::RequestVersion)?;
                }
                DartfrogInput::Rumors(rumor_request) => {
                    let network_hub_address = get_server_address(NETWORK_HUB);
                    match rumor_request.clone() {
                        RumorRequest::CreateNewRumor(rumor_text) => {
                            let trimmed_rumor_text = rumor_text.chars().take(2048).collect::<String>();
                            poke(&network_hub_address, DartfrogInput::Rumors(RumorRequest::CreateNewRumor(trimmed_rumor_text)))?;

                        }
                        RumorRequest::RequestAllRumors => {
                            poke(&network_hub_address, DartfrogInput::Rumors(rumor_request))?;
                        }
                        _ => {}
                    }
                }
                DartfrogInput::SetProfile(profile) => {
                    state.profile = profile;
                    let local_user = DartfrogOutput::LocalUser(state.profile.clone(), state.activity.clone(), state.activity_setting.clone());
                    update_consumer(channel_id, local_user)?;
                    state.save(); // Save after updating profile
                },
                DartfrogInput::SetActivitySetting(setting) => {
                    state.activity_setting = setting;
                    let local_user = DartfrogOutput::LocalUser(state.profile.clone(), state.activity.clone(), state.activity_setting.clone());
                    update_consumer(channel_id, local_user)?;
                    state.save(); // Save after updating profile
                },
                DartfrogInput::CreateService(options) => {
                    let address_str = format!("{}@{}", our.node, options.process_name);
                    let address = Address::from_str(address_str.as_str());
                    match address {
                        Ok(address) => {
                            // forward the request
                            let req = ProviderInput::DartfrogRequest(DartfrogToProvider::CreateService(options));
                            poke(&address, req)?;
                        }
                        _ => {
                        }
                    }

                },
                DartfrogInput::EditService{id, options} => {
                    let maybe_service_id = ServiceID::from_string(&id);
                    match maybe_service_id {
                        Some(service_id) => {
                            // Forward the edit request to the service provider
                            let req = ProviderInput::DartfrogRequest(DartfrogToProvider::EditService(id, options));
                            poke(&service_id.address, req)?;
                        }
                        _ => {
                            println!("Failed to parse service ID: {:?}", id);
                        }
                    }
                },
                DartfrogInput::DeleteService(id) => {
                    let maybe_service_id = ServiceID::from_string(&id);
                    match maybe_service_id {
                        Some(service_id) => {
                            // Delete the service locally
                            state.local_services.remove(&id);
                            
                            // Forward the request
                            let req = ProviderInput::DartfrogRequest(DartfrogToProvider::DeleteService(id));
                            poke(&service_id.address, req)?;
                            
                            // Update all consumers with the new service list
                            let services: Vec<Service> = state.local_services.values().cloned().collect();
                            update_all_consumers(state, DartfrogOutput::LocalServiceList(services))?;
                            
                            state.save(); // Save after deleting a service
                        }
                        _ => {
                            println!("failed to parse {:?}", id);
                        }
                    }
                }
                DartfrogInput::Heartbeat => {
                    state.activity = PeerActivity::Online(get_now());
                }
                DartfrogInput::RequestLocalService(id) => {
                    match state.local_services.get(&id) {
                        Some(service) => {
                            update_consumer(channel_id, DartfrogOutput::LocalService(service.clone()))?;
                        }
                        None => {
                        }
                    }
                },
                DartfrogInput::RequestLocalServiceList => {
                    let services: Vec<Service> = state.local_services.values().cloned().collect();
                    update_consumer(channel_id, DartfrogOutput::LocalServiceList(services))?;
                }
                DartfrogInput::LocalDeletePeer(node) => {
                    match state.peers.get(&node) {
                        Some(peer) => {
                            state.peers.remove(&node);
                            let peers: Vec<Peer> = state.peers.values().cloned().collect();
                            update_consumer(channel_id, DartfrogOutput::PeerList(peers))?;
                            state.save(); // Save after deleting a peer
                        }
                        None => {
                        }
                    }
                },
                DartfrogInput::LocalRequestPeer(node) => {
                    match state.peers.get(&node) {
                        Some(peer) => {
                            update_consumer(channel_id, DartfrogOutput::Peer(peer.clone()))?;
                        }
                        None => {
                        }
                    }
                },
                DartfrogInput::LocalRequestAllPeers => {
                    let peers: Vec<Peer> = state.peers.values().cloned().collect();
                    update_consumer(channel_id, DartfrogOutput::PeerList(peers))?;
                },
                DartfrogInput::LocalFwdAllPeerRequests => {
                    for peer in state.peers.values_mut() {
                        let address = get_server_address(&peer.node);
                        peer.outstanding_request = Some(get_now());
                        poke(&address, DartfrogInput::RemoteRequestPeer)?;
                    }
                },
                DartfrogInput::LocalFwdPeerRequest(node) => {
                    if source.node != our.node { return Ok(()); }
                    
                    let peer = state.peers.entry(node.clone())
                        .or_insert_with(|| Peer::new(node.clone()));
                    
                    peer.outstanding_request = Some(get_now());
                    let update = DartfrogOutput::Peer(peer.clone());
                    update_all_consumers(state, update)?;

                    let address = get_server_address(&node);
                    poke(&address, DartfrogInput::RemoteRequestPeer)?;
                }
                DartfrogInput::LocalDirectMessages(dm_request) => {
                    match dm_request {
                        LocalDirectMessagePoke::CreateMessageStore(node) => {
                            if !state.messages.contains_key(&node) {
                                let new_store = MessageStore::new(node.clone());
                                state.messages.insert(node.clone(), new_store);
                                update_all_consumers(state, DartfrogOutput::MessageStoreList(state.messages.values().cloned().collect()))?;
                                state.save(); // Save after creating a new message store
                            }
                        },
                        LocalDirectMessagePoke::SendMessage(node, message) => {
                            let message_store = state.messages.entry(node.clone())
                                .or_insert_with(|| MessageStore::new(node.clone()));
                            
                            let new_message = DirectMessage {
                                id: SystemTime::now()
                                    .duration_since(UNIX_EPOCH)
                                    .unwrap()
                                    .as_nanos()
                                    .to_string(),
                                from: our.node.clone(),
                                is_unread: false,
                                contents: message,
                                time_received: get_now(),
                            };
                            
                            message_store.history.push(new_message.clone());
                            
                            // Update local consumers
                            update_all_consumers(state, DartfrogOutput::MessageStoreList(state.messages.values().cloned().collect()))?;
                            
                            // Send message to remote peer
                            let remote_poke = RemoteDirectMessagePoke::SendMessage(new_message.id, new_message.contents);
                            let address = get_server_address(&node);
                            poke(&address, DartfrogInput::RemoteDirectMessages(remote_poke))?;
                            
                            state.save(); // Save after sending a message
                        },
                        LocalDirectMessagePoke::ClearUnreadMessageStore(node) => {
                            if let Some(message_store) = state.messages.get_mut(&node) {
                                for message in &mut message_store.history {
                                    message.is_unread = false;
                                }
                                update_all_consumers(state, DartfrogOutput::MessageStoreList(state.messages.values().cloned().collect()))?;
                                state.save(); // Save after clearing unread messages
                            }
                        },
                    }
                }
                _ => {
                }
            }
        }
        HttpServerRequest::WebSocketClose(channel_id) => {
            state.consumers.remove(&channel_id);
            state.save(); // Save after removing a consumer
        }
        HttpServerRequest::Http(_request) => {
        }
    };

    Ok(())
}

fn handle_request_peer(
    our: &Address,
    state: &mut DartfrogState,
    source: &Address,
    node: &String,
) -> anyhow::Result<()> {
    if our.node != source.node {
        return Ok(());
    }
    // If we have it, send our current version of the peer
    if let Some(peer) = state.peers.get_mut(node) {
        peer.outstanding_request = Some(get_now());
        let update = DartfrogToProvider::Peer(peer.clone());
        update_provider_consumer(source, state, update)?;
    } else {
        // Insert a new peer if we don't have it
        let mut new_peer = Peer::new(node.clone());
        new_peer.outstanding_request = Some(get_now());
        state.peers.insert(node.clone(), new_peer.clone());
        let update = DartfrogToProvider::Peer(new_peer);
        update_provider_consumer(source, state, update)?;
    }
    // Either way, send a remote request to the peer for its latest peer data
    let address = get_server_address(node);
    poke(&address, DartfrogInput::RemoteRequestPeer)?;
    Ok(())
}

fn handle_provider_output(
    our: &Address,
    state: &mut DartfrogState,
    source: &Address,
    app_message: ProviderOutput,
) -> anyhow::Result<()> {
    if source.node != our.node {
        return Ok(());
    }

    match app_message {
       ProviderOutput::DeleteService(id) => {
            if id.address.node != source.node ||
               id.address.process != source.process
            {
                // ignore
                return Ok(())
            }
            if let Some(service) = state.local_services.remove(&id.to_string()) {
                let update = DartfrogOutput::LocalServiceList(state.local_services.values().cloned().collect());
                update_all_consumers(state, update)?;
                state.save(); // Save after deleting a service
            }
        },
        ProviderOutput::Service(service) => {
            // source process == service process
            if service.id.address.node != source.node ||
               service.id.address.process != source.process
            {
                // ignore
                return Ok(())
            }
            state.local_services.insert(service.id.to_string(), service.clone());
            let update = DartfrogOutput::LocalService(service);
            update_all_consumers(state, update)?;
            state.save(); // Save after adding or updating a service
        },
        ProviderOutput::ServiceList(services) => {
            for service in services {
                if service.id.address.node == source.node &&
                   service.id.address.process == source.process
                {
                    state.local_services.insert(service.id.to_string(), service.clone());
                }
            }
            let update = DartfrogOutput::LocalServiceList(state.local_services.values().cloned().collect());
            update_all_consumers(state, update)?;
            state.save(); // Save after updating service list
        },
        ProviderOutput::RequestPeer(node) => {
            if our.node != source.node {
                return Ok(());
            }
            handle_request_peer(our, state, source, &node)?;
        }
        ProviderOutput::RequestPeerList(nodes) => {
            if our.node != source.node {
                return Ok(());
            }
            for node in nodes {
                // TODO more efficient to respond with a peerlist instead of one at a time.
                handle_request_peer(our, state, source, &node)?;
            }
        }
        ProviderOutput::RequestKnownPeers => {
            if our.node != source.node {
                return Ok(());
            }
            
            // Collect the keys (node names) from the peers map
            let known_peers: Vec<Peer> = state.peers.values().cloned().collect();
            
            // Send the list of known peers back to the requesting provider
            let update = DartfrogToProvider::PeerList(known_peers);
            update_provider_consumer(source, state, update)?;
        }
        ProviderOutput::FrontendActivity => {
            if our.node != source.node {
                return Ok(());
            }
            state.activity = PeerActivity::Online(get_now());
        }
    }
    Ok(())
}

const MAX_RUMORS: usize = 32;

fn handle_dartfrog_input(
    our: &Address,
    state: &mut DartfrogState,
    source: &Address,
    dartfrog_input: DartfrogInput,
) -> anyhow::Result<()> {

    match dartfrog_input {
        DartfrogInput::LocalFwdAllPeerRequests => {
            if source.node != our.node { return Ok(()); }
            for peer in state.peers.values() {
                let address = get_server_address(&peer.node);
                poke(&address, DartfrogInput::RemoteRequestPeer)?;
            }
        },
        DartfrogInput::LocalFwdPeerRequest(node) => {
            if source.node != our.node { return Ok(()); }
            
            let peer = state.peers.entry(node.clone())
                .or_insert_with(|| Peer::new(node.clone()));
            
            peer.outstanding_request = Some(get_now());
            let update = DartfrogOutput::Peer(peer.clone());
            update_all_consumers(state, update)?;

            let address = get_server_address(&node);
            poke(&address, DartfrogInput::RemoteRequestPeer)?;
        }
        DartfrogInput::RemoteRequestPeer => {
            let address = get_server_address(&source.node());
            let activity = match state.activity_setting {
                ActivitySetting::Public => state.activity.clone(),
                ActivitySetting::Private => PeerActivity::Private,
            };
            let my_peer_data = PeerData {
                profile: state.profile.clone(),
                hosted_services: state.local_services.values()
                    .filter(|service| matches!(service.meta.visibility, ServiceVisibility::Visible))
                    .map(|service| service.clone().to_public())
                    .collect(),
                activity,
            };
            poke(&address, DartfrogInput::RemoteResponsePeer(my_peer_data))?;
        }
        DartfrogInput::RemoteResponsePeer(peer_data) => {
            let Some(local_peer) = state.peers.get_mut(source.node()) else {
                return Ok(());
            };
            // println!("peer response {:?} {:?}", source.node(), peer_data);
            match local_peer.outstanding_request {
                None => {
                }
                Some(time) => {
                    local_peer.peer_data = Some(peer_data);
                    local_peer.outstanding_request = None;
                    local_peer.last_updated = Some(get_now());
                    let local_peer_clone = local_peer.clone();
                    update_all_of_new_peer(state, local_peer_clone)?;
                    state.save(); // Save after updating peer data
                }
            }
        }
        DartfrogInput::RemoteRequestAllPeerNodes => {
            // Add the source.node as a new peer if it doesn't exist
            if !state.peers.contains_key(&source.node) {
                let new_peer = Peer::new(source.node.clone());
                state.peers.insert(source.node.clone(), new_peer);
                state.save(); // Save after adding a new peer
            }

            // Now collect all peer nodes, including the newly added one
            let peer_nodes: Vec<String> = state.peers.keys().cloned().collect();
            let address = get_server_address(&source.node());
            poke(&address, DartfrogInput::RemoteResponseAllPeerNodes(peer_nodes))?;
        }
        DartfrogInput::RemoteResponseAllPeerNodes(nodes) => {
            if Some(source.node.clone()) != state.network_hub { return Ok(()); }
            
            for node in nodes {
                if !state.peers.contains_key(&node) {
                    // Add new blank peer
                    let mut new_peer = Peer::new(node.clone());
                    new_peer.outstanding_request = Some(get_now());
                    state.peers.insert(node.clone(), new_peer);
                    
                    // Contact the new peer
                    let address = get_server_address(&node);
                    poke(&address, DartfrogInput::RemoteRequestPeer)?;
                }
            }
            
            state.save(); // Save after adding new peers
        }
        DartfrogInput::RemoteDirectMessages(dm_request) => {
            match dm_request {
                RemoteDirectMessagePoke::SendMessage(id, text) => {
                    let message_store = state.messages.entry(source.node.clone())
                        .or_insert_with(|| MessageStore::new(source.node.clone()));
                    
                    let new_message = DirectMessage {
                        id: id,
                        from: source.node.clone(),
                        is_unread: true,
                        contents: text,
                        time_received: get_now(),
                    };
                    
                    message_store.history.push(new_message);
                    // Update all consumers with the new message
                    let message_store_clone = message_store.clone();
                    update_all_consumers(state, DartfrogOutput::MessageStore(message_store_clone))?;
                    
                    state.save(); // Save after adding a new message
                }
            }
        }
        DartfrogInput::Rumors(rumor_request) => {
            match rumor_request {
                RumorRequest::CreateNewRumor(rumor) => {
                    let trimmed_rumor = rumor.chars().take(2048).collect::<String>();
                    state.rumors.insert(0, trimmed_rumor.clone());
                    if state.rumors.len() > MAX_RUMORS {
                        state.rumors.pop();
                    }
                    for peer in state.peers.keys() {
                        let address = get_server_address(peer);
                        poke(&address, DartfrogInput::Rumors(RumorRequest::UpdateNewRumor(trimmed_rumor.clone())))?;
                    }
                },
                RumorRequest::RequestAllRumors => {
                    let address = get_server_address(&source.node());
                    poke(&address, DartfrogInput::Rumors(RumorRequest::UpdateAllRumors(state.rumors.clone())))?;
                },
                RumorRequest::UpdateNewRumor(rumor) => {
                    if source.node != NETWORK_HUB { return Ok(()); }
                    if our.node != NETWORK_HUB {
                        state.rumors.insert(0, rumor.clone());
                        if state.rumors.len() > MAX_RUMORS {
                            state.rumors.pop();
                        }
                    }
                    update_all_consumers(state, DartfrogOutput::Rumor(rumor))?;
                },
                RumorRequest::UpdateAllRumors(all_rumors) => {
                    if source.node != NETWORK_HUB { return Ok(()); }
                    state.rumors = all_rumors;
                    update_all_consumers(state, DartfrogOutput::RumorList(state.rumors.clone()))?;
                },
            }
        }
        _ => {
            // println!("unhandled DartfrogInput: {:?}", dartfrog_input);
        }
    }
    Ok(())
}

fn handle_message(our: &Address, state: &mut DartfrogState) -> anyhow::Result<()> {
    let message = await_message()?;

    let body = message.body();
    let source = message.source();
    if !message.is_request() {
        return Err(anyhow::anyhow!("unexpected Response: {:?}", message));
    }
    if message.source().node == our.node
        && message.source().process == "http_server:distro:sys" {
        handle_http_server_request(our, state, source, body)
    } else {
        if let Ok(app_message) = serde_json::from_slice::<ProviderOutput>(&body) {
            handle_provider_output(our, state, source, app_message)?;
        }
        if let Ok(dartfrog_input) = serde_json::from_slice::<DartfrogInput>(&body) {
            handle_dartfrog_input(our, state, source, dartfrog_input)?;
        }
        if let Ok(version_request) = serde_json::from_slice::<VersionControl>(&body) {
            match version_request {
                VersionControl::RequestVersion => {
                    let address = get_server_address(&source.node);
                    poke(&address, VersionControl::RequestVersionResponse(DARTFROG_VERSION.to_string()))?;
                }
                VersionControl::RequestVersionResponse(version_string) => {
                    if source.node == NETWORK_HUB.to_string() {
                        let update = DartfrogOutput::RequestVersionResponse(NETWORK_HUB.to_string(), version_string);
                        update_all_consumers(state, update)?;
                    }
                }
            }
        }
        Ok(())
    }
}

call_init!(init);
fn init(our: Address) {
    println!("initializing");
    
    // Serve the index.html and other UI files found in pkg/ui at the root path.
    http::secure_serve_ui(&our, "ui", vec!["/", "*"]).unwrap();

    // Allow websocket to be opened at / (our process ID will be prepended).
    http::secure_bind_ws_path("/", true).unwrap();

    Request::to(("our", "homepage", "homepage", "sys"))
        .body(
            serde_json::json!({
                "Add": {
                    "label": "dartfrog",
                    "icon": constants::HOMEPAGE_IMAGE,
                    "path": "/",
                }
            })
            .to_string()
            .as_bytes()
            .to_vec(),
        )
        .send()
        .unwrap();

    let mut state = DartfrogState::load(&our);
    if state.network_hub.is_none() {
        state.network_hub = Some(NETWORK_HUB.to_string());
    }
    if !state.peers.contains_key(NETWORK_HUB) {
        let network_hub_peer = Peer::new(NETWORK_HUB.to_string());
        state.peers.insert(NETWORK_HUB.to_string(), network_hub_peer);
    }

    let network_hub_address = get_server_address(NETWORK_HUB);
    poke(&network_hub_address, DartfrogInput::RemoteRequestAllPeerNodes).unwrap();

    state.save(); // Save initial state if changes were made

    loop {
        if let Err(e) = handle_message(&our, &mut state) {
            println!("handle_message error: {:?}", e);
        }
    }
}