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

#[derive(Debug, Clone)]
pub struct DartfrogState {
    pub network_hub: Option<String>,
    pub consumers: HashMap<u32, Consumer>,
    pub provider_consumers: HashMap<Address, Consumer>,
    pub local_services: HashMap<String, Service>,
    pub peers: HashMap<String, Peer>,
    pub profile: Profile,
    pub activity_setting: ActivitySetting,
    pub activity: PeerActivity,
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
    let consumer = state.provider_consumers.entry(source.clone()).or_insert_with(|| {
        Consumer {
            ws_channel_id: 0,
            last_active: get_now(),
        }
    });
    let req = ProviderInput::DartfrogRequest(update);
    poke(source, req)?;
    Ok(())
}

fn update_all_provider_consumers(
    state: &DartfrogState,
    update: DartfrogToProvider,
) -> anyhow::Result<()> {
    for address in state.provider_consumers.keys() {
        let req = ProviderInput::DartfrogRequest(update.clone());
        poke(address, req)?;
    }
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
                hosted_services: state.local_services.values().cloned().collect(),
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
            let local_user = DartfrogOutput::LocalUser(state.profile.clone(), state.activity.clone(), state.activity_setting.clone());
            update_consumer(channel_id, local_user)?;
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
                DartfrogInput::SetProfile(profile) => {
                    state.profile = profile;
                    let local_user = DartfrogOutput::LocalUser(state.profile.clone(), state.activity.clone(), state.activity_setting.clone());
                    update_consumer(channel_id, local_user)?;
                },
                DartfrogInput::CreateService(service_name, process_name) => {
                    let address_str = format!("{}@{}", our.node, process_name);
                    let address = Address::from_str(address_str.as_str());
                    match address {
                        Ok(address) => {
                            // forward the request
                            let req = ProviderInput::DartfrogRequest(DartfrogToProvider::CreateService(service_name));
                            poke(&address, req)?;
                        }
                        _ => {
                        }
                    }

                },
                DartfrogInput::DeleteService(id) => {
                    let maybe_service_id = ServiceID::from_string(&id);
                    match maybe_service_id {
                        Some(service_id) => {
                            // forward the request
                            let req = ProviderInput::DartfrogRequest(DartfrogToProvider::DeleteService(id));
                            poke(&service_id.address, req)?;
                        }
                        _ => {
                            println!("failed to parse {:?}", id);
                        }
                    }

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
                },
                _ => {
                }
            }
        }
        HttpServerRequest::WebSocketClose(channel_id) => {
            state.consumers.remove(&channel_id);
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
    }
    Ok(())
}

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
            let my_peer_data = PeerData {
                profile: state.profile.clone(),
                hosted_services: state.local_services.values().cloned().collect(),
                activity: state.activity.clone(),
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
                }
            }
        }
        _ => {
            println!("unhandled DartfrogInput: {:?}", dartfrog_input);
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

    let mut state = DartfrogState::new(&our);
    state.network_hub = Some(NETWORK_HUB.to_string());
    let network_hub_peer = Peer::new(NETWORK_HUB.to_string());
    state.peers.insert(NETWORK_HUB.to_string(), network_hub_peer);

    loop {
        match handle_message(&our, &mut state) {
            Ok(()) => {}
            Err(e) => {
                println!("handle_message error: {:?}", e);
            }
        };
    }
}