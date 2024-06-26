use std::collections::{HashMap, HashSet};
use std::time::{SystemTime, UNIX_EPOCH};

// mod common;
use common::*;
use kinode_process_lib::vfs::{create_drive, open_file};
mod constants;
use kinode_process_lib::{http, await_message, call_init, println, Address, Request,
    get_blob,
    LazyLoadBlob,
    http::{
        send_ws_push, HttpServerRequest,
        WsMessageType,
    },
    our_capabilities,
    spawn,
};

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});

fn handle_server_request(our: &Address, state: &mut DartState, source: Address, req: ServerRequest) -> anyhow::Result<()> {
    match req {
        ServerRequest::ServiceRequest(service_id, service_request) => {
            match handle_service_request(our, state, source, service_id, service_request) {
                Ok(_) => {}
                Err(e) => {
                    println!("error handling service request: {:?}", e);
                }
            }
        }
        ServerRequest::CreateService(service_id, plugins) => {
            if source.node != our.node {
                return Ok(());
            }
            if service_id.node != our.node {
                return Ok(());
            }
            if let Some(_service) = state.server.services.get(&service_id.id) {
                // already exists
            } else {
                let mut service = new_service(service_id.clone());
                for plugin in plugins {
                    match get_plugin_address(&plugin, our.node.as_str()) {
                      Ok(plugin_address) => {
                            // TODO vfs for plugin metadata sharing
                            service.metadata.plugins.insert(plugin.clone());
                            let plugin_metadata = PluginMetadata {
                                plugin_name: plugin.clone(),
                                service: service.clone(),
                            };
                            poke_plugin(&plugin_address, &PluginMessage::ServiceInput(service.clone(), PluginServiceInput::Init(plugin_metadata)))?;
                        }
                        Err(e) => {
                        }
                    }
                }

                state.server.services.insert(service_id.id.clone(), service.clone());
                // TODO read_service??? for restoring state
                write_service(state.server.drive_path.clone(), &service)?;
            }
        }
        ServerRequest::DeleteService(service_id) => {
            if source.node != our.node {
                return Ok(());
            }
            if let Some(service) = state.server.services.get(&service_id.id) {
                for subscriber in service.metadata.subscribers.clone() {
                    let update = ConsumerUpdate::FromService(service_id.node.clone(), service_id.id.clone(), ConsumerServiceUpdate::Kick);
                    update_client_consumer(update, subscriber)?;
                }
                for plugin in service.metadata.plugins.clone() {
                    if let Ok(plugin_address) = get_plugin_address(&plugin, our.node.as_str()) {
                        poke_plugin(&plugin_address, &PluginMessage::ServiceInput(service.clone(), PluginServiceInput::Kill))?;
                    }
                }
                state.server.services.remove(&service_id.id.clone());
            }

        }
        ServerRequest::RequestServiceList => {

            let services: HashMap<String, ServiceMetadata> = state.server.services.iter().map(|(id, service)| {
                let service_id = ServiceId {
                    node: our.node.clone(),
                    id: id.clone()
                };
                (get_service_id_string(&service_id), service.metadata.clone())
            }).collect();
            let update = ConsumerUpdate::FromServer(our.node.clone(), ConsumerServerUpdate::ServiceList(services));
            update_client_consumer(update, source.node.clone())?;
        }
    }
    Ok(())
}

fn make_consumer_service_update(service_id: ServiceId, update: ConsumerServiceUpdate) -> ConsumerUpdate {
    ConsumerUpdate::FromService(service_id.node.clone(), service_id.id.clone(), update)
}

fn write_service(drive_path: String, service: &Service) -> anyhow::Result<()> {
    let service_name = service.id.id.clone();
    let file_path = format!("{}/{}.service.txt", drive_path, service_name);
    let file = open_file(&file_path, true, None);
    match file {
        Ok(mut file) => {
            let metadata = serde_json::to_string(&service)?;
            let bytes = metadata.as_bytes();
            match file.set_len(bytes.len() as u64) {
                Ok(_) => {
                    match file.write_all(metadata.as_bytes()) {
                        Ok(_) => {}
                        Err(e) => {
                            println!("error writing service metadata: {:?}", e);
                        }
                    }
                }
                Err(e) => {
                    println!("error writing service metadata: {:?}", e);
                }
            }
        }
        Err(e) => {
            println!("error writing service metadata: {:?}", e);
        }
    }
    Ok(())
}

fn poke_plugins(service:&Service, poke: PluginServiceInput, our: &Address) -> anyhow::Result<()> {
    for plugin in service.metadata.plugins.clone() {

        if let Ok(plugin_address) = get_plugin_address(&plugin, our.node.as_str()) {
            poke_plugin(&plugin_address, &PluginMessage::ServiceInput(service.clone(), poke.clone()))?;
        }
    }
    Ok(())
}

fn handle_service_request(our: &Address, state: &mut DartState, source: Address, service_id: ServiceId, req: ServiceRequest) -> anyhow::Result<()> {
    if service_id.node != our.node {
        return Ok(());
    }
    if let Some(service) = state.server.services.get_mut(&service_id.id) {
        // handle the request
        match req {
            ServiceRequest::PluginRequest(plugin_name, plugin_req) => {
                if service.metadata.plugins.contains(&plugin_name) {
                    if let Ok(plugin_address) = get_plugin_address(&plugin_name, our.node.as_str()) {
                        poke_plugin(&plugin_address, &PluginMessage::ServiceInput(service.clone(), PluginServiceInput::Message(source.node.clone(), PluginNodeType::Client, plugin_req)))?;
                    }
                }
            }
            ServiceRequest::Subscribe => {
                let mut subscriber_is_new = false;
                if !service.metadata.subscribers.contains(&source.node.clone()) {
                    // subscriber is new, notify plugins
                    subscriber_is_new = true;
                }
                service.metadata.subscribers.insert(source.node.clone());
                service.metadata.user_presence.insert(source.node.clone(), Presence {
                    time: SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs(),
                });
                write_service(state.server.drive_path.clone(), service)?;
                if subscriber_is_new {
                    poke_plugins(&service, PluginServiceInput::ClientJoined(source.node.clone()), our)?;
                    let meta = make_consumer_service_update(service_id.clone(), ConsumerServiceUpdate::ServiceMetadata(service.metadata.clone()));
                    update_subscribers(meta, service.metadata.subscribers.clone())?;
                }
                let ack = make_consumer_service_update(service_id.clone(), ConsumerServiceUpdate::SubscribeAck(service.metadata.clone()));
                update_client_consumer(ack, source.node.clone())?;
            }
            ServiceRequest::Unsubscribe => {
                if !service.metadata.subscribers.contains(&source.node.clone()) {
                    // already unsubscribed, ignore
                    return Ok(());
                }
                service.metadata.subscribers.remove(&source.node.clone());
                poke_plugins(&service, PluginServiceInput::ClientExited(source.node.clone()), our)?;
                write_service(state.server.drive_path.clone(), service)?;
                let meta = make_consumer_service_update(service_id, ConsumerServiceUpdate::ServiceMetadata(service.metadata.clone()));
                update_subscribers(meta, service.metadata.subscribers.clone())?;
            }
            ServiceRequest::PresenceHeartbeat => {
                if !service.metadata.subscribers.contains(&source.node.clone()) {
                    // not subscribed, ignore
                    return Ok(());
                }
                service.metadata.user_presence.insert(source.node.clone(), Presence {
                    time: SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs(),
                });
                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
                if (now - service.metadata.last_sent_presence) < 1*60 {
                    // "regular metadata updates"
                    // these are evoked by client heartbeats, but only sent up to a capped rate
                    return Ok(());
                }
                // 
                // check if anyone needs to be kicked
                // 
                let mut to_kick: HashSet<String> = HashSet::new();
                for (user, presence) in service.metadata.user_presence.iter() {
                    const THREE_MINUTES : u64 = 3*60;
                    if (now - presence.time) > THREE_MINUTES {
                        to_kick.insert(user.clone());
                    }
                }

                for user in service.metadata.subscribers.iter() {
                    if to_kick.contains(user) {
                        let update: ConsumerUpdate = ConsumerUpdate::FromService(service_id.node.clone(), service_id.id.clone(), ConsumerServiceUpdate::Kick);
                        update_client_consumer(update, user.clone())?;
                        poke_plugins(&service, PluginServiceInput::ClientExited(source.node.clone()), our)?;
                    }
                }
                service.metadata.subscribers.retain(|x| !to_kick.contains(x));

                // send metadata update
                service.metadata.last_sent_presence = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
                write_service(state.server.drive_path.clone(), service)?;
                let meta = make_consumer_service_update(service_id, ConsumerServiceUpdate::ServiceMetadata(service.metadata.clone()));
                update_subscribers(meta, service.metadata.subscribers.clone())?;
            }
            _ => {
                println!("unexpected service request: {:?}", req);
            }
        }
    } else {
        // respond with NoSuchService
        let update = ConsumerUpdate::FromServer(our.node().to_string(), ConsumerServerUpdate::NoSuchService(service_id.id.clone()));
        update_client_consumer(update, source.node.clone())?;
    }
    Ok(())
}

fn update_subscribers(update: ConsumerUpdate, subscribers: HashSet<String>) -> anyhow::Result<()> {
    for subscriber in subscribers {
        update_client_consumer(update.clone(), subscriber)?;
    }
    Ok(())
}


fn handle_client_update(our: &Address, state: &mut DartState, source: &Address, upd: ClientUpdate) -> anyhow::Result<()> {
    match upd {
        ClientUpdate::ConsumerUpdate(consumer_update) => {
            // possibly intercept the update first
            // TODO filter out lying updates
            // e.g. an update could lie about its source address if not checked
            match consumer_update.clone() {
                ConsumerUpdate::FromServer(server_node, _inner) => {
                    // handle the request
                    if server_node != source.node {
                        // no spoofing
                        return Ok(());
                    }
                    update_all_consumers(&state, consumer_update.clone());
                    
                }
                ConsumerUpdate::FromService(service_node, service_name, inner) => {
                    // handle the request

                    if service_node != source.node {
                        // no spoofing
                        return Ok(());
                    }

                    let service_id: ServiceId = ServiceId {
                        node: service_node.clone(),
                        id: service_name.clone()
                    };
                    let mut sent_to_plugin = false;
                    for (_consumer_id, consumer) in state.client.consumers.iter_mut() {
                        if !consumer.services.contains_key(&service_id) {
                            continue;
                        }
                        match inner {
                            ConsumerServiceUpdate::Kick => {
                                consumer.services.remove(&service_id);
                                update_consumer(consumer.ws_channel_id, consumer_update.clone())?;
                            }
                            ConsumerServiceUpdate::ServiceMetadata(ref metadata) => {
                                let service = consumer.services.get_mut(&service_id).unwrap();
                                service.service.metadata = metadata.clone();
                                service.connection = ConnectionStatus::Connected(
                                    SystemTime::now()
                                        .duration_since(UNIX_EPOCH)
                                        .unwrap()
                                        .as_secs(),
                                );
                                update_consumer(consumer.ws_channel_id, consumer_update.clone())?;
                            }
                            ConsumerServiceUpdate::MessageFromPluginServiceToClient(ref plugin, ref upd) => {
                                // authenticate the plugin
                                let Ok(expected_source ) = get_plugin_address(plugin, service_id.node.as_str()) else {
                                    return Ok(());
                                };

                                if source != &expected_source {
                                    return Ok(());
                                }

                                if sent_to_plugin {
                                    // don't duplicate updates
                                    continue;
                                }
                                let service = consumer.services.get_mut(&service_id).unwrap();
                                if service.service.metadata.plugins.contains(plugin) {
                                    sent_to_plugin = true;
                                    let update = PluginClientInput::FromService(upd.clone());
                                    poke_plugin_client(plugin, &update, &service.service, our)?;
                                }
                            }
                            ConsumerServiceUpdate::MessageFromPluginServiceToFrontend(ref plugin, ref upd) => {
                                // authenticate the plugin
                                let Ok(expected_source ) = get_plugin_address(plugin, service_id.node.as_str()) else {
                                    return Ok(());
                                };

                                if source != &expected_source {
                                    return Ok(());
                                }

                                let service = consumer.services.get_mut(&service_id).unwrap();
                                if service.service.metadata.plugins.contains(plugin) {
                                    sent_to_plugin = true;
                                    update_consumer(consumer.ws_channel_id, consumer_update.clone())?;
                                }
                            }
                            ConsumerServiceUpdate::MessageFromPluginClient(ref plugin, ref upd) => {
                                // authenticate the plugin
                                let Ok(expected_source ) = get_plugin_address(plugin, our.node.as_str()) else {
                                    return Ok(());
                                };
                                if source != &expected_source {
                                    return Ok(());
                                }
                                let service = consumer.services.get_mut(&service_id).unwrap();
                                if service.service.metadata.plugins.contains(plugin) {
                                    update_consumer(consumer.ws_channel_id, consumer_update.clone())?;
                                }
                            }
                            ConsumerServiceUpdate::SubscribeAck(ref metadata) => {
                                let service = consumer.services.get_mut(&service_id).unwrap();
                                service.service.metadata = metadata.clone();
                                service.connection = ConnectionStatus::Connected(
                                    SystemTime::now()
                                        .duration_since(UNIX_EPOCH)
                                        .unwrap()
                                        .as_secs(),
                                );
                                let metadata_update = ConsumerUpdate::FromService(service.service.id.node.clone(), service.service.id.id.clone(), ConsumerServiceUpdate::ServiceMetadata(service.service.metadata.clone()));
                                update_consumer(consumer.ws_channel_id, metadata_update)?;
                                if sent_to_plugin {
                                    // don't duplicate updates
                                    continue;
                                }
                                sent_to_plugin = true;
                                let update = PluginClientInput::FrontendJoined;
                                for plugin in service.service.metadata.plugins.iter() {
                                    poke_plugin_client(plugin, &update, &service.service, our)?;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    Ok(())
}

fn handle_client_request(our: &Address, state: &mut DartState, source: Address, req: ClientRequest) -> anyhow::Result<()> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    match req {
        ClientRequest::DeleteConsumer(num) => {
            if source.node != our.node {
                return Ok(());
            }

            let mut all_services: HashMap<ServiceId, HashSet<u32>> = HashMap::new();
            for (id, consumer) in state.client.consumers.iter() {
                for (service_id, _service) in consumer.services.iter() {
                    all_services
                        .entry(service_id.clone())
                        .or_insert_with(HashSet::new)
                        .insert(id.clone());
                }
            }
            if let Some(consumer) = state.client.consumers.get(&num) {
                for (service_id, _service) in consumer.services.iter() {
                    // TODO this kind of sucks
                    // here we only send the unsub if no other consumer is subscribed to the service in question
                    // 
                    // in the future, consumers should just unsubscribe onclose,
                    //  it just requires extending some consumer scope to the service
                    //  but that adds some complexity, and could be inefficient if not done correctly
                    // 
                    let consumers_with_this_service = all_services.get(&service_id).unwrap();
                    if consumers_with_this_service.len() == 1 {
                        let s_req = ServerRequest::ServiceRequest(service_id.clone(), ServiceRequest::Unsubscribe);
                        let address = get_server_address(service_id.node.as_str());
                        poke_server(&address, s_req)?;
                    }
                }
                state.client.consumers.remove(&num);
            }
        }
        ClientRequest::ConsumerRequest(num, inner) => {
            let Some(consumer) = state.client.consumers.get_mut(&num) else {
                return Ok(());
            };
            consumer.last_active = now;

            match inner {
                ConsumerRequest::JoinService(sid) => {
                    if source.node != our.node {
                        return Ok(());
                    }
                    if let Some(_service) = consumer.services.get(&sid) {
                        // already have it
                        // send this anyways just to refresh the connection
                        let s_req = ServerRequest::ServiceRequest(sid.clone(), ServiceRequest::Subscribe);
                        let address = get_server_address(sid.clone().node.as_str());
                        poke_server(&address, s_req)?;
                    } else {
                        consumer.services.insert(sid.clone(), new_sync_service(sid.clone()));

                        let s_req = ServerRequest::ServiceRequest(sid.clone(), ServiceRequest::Subscribe);
                        let address = get_server_address(sid.clone().node.as_str());
                        poke_server(&address, s_req)?;
                    }
                }
                ConsumerRequest::ExitService(sid) => {
                    if source.node != our.node {
                        return Ok(());
                    }
                    if let Some(_service) = consumer.services.get(&sid) {
                        let s_req = ServerRequest::ServiceRequest(sid.clone(), ServiceRequest::Unsubscribe);
                        let address = get_server_address(sid.clone().node.as_str());
                        poke_server(&address, s_req)?;
                        consumer.services.remove(&sid);

                    } else {
                        // already have it
                        // TODO maybe tell frontend that it's already gone
                    }
                }
                ConsumerRequest::ServiceHeartbeat(sid) => {
                    if source.node != our.node {
                        return Ok(());
                    }
                    if let Some(_service) = consumer.services.get(&sid) {
                        let s_req = ServerRequest::ServiceRequest(sid.clone(), ServiceRequest::PresenceHeartbeat);
                        let address = get_server_address(sid.clone().node.as_str());
                        poke_server(&address, s_req)?;
                    } else {
                        // dont have this service
                        // TODO maybe tell frontend that it's missing
                    }
                }
                ConsumerRequest::RequestServiceList(server_node) => {
                    let s_req = ServerRequest::RequestServiceList;
                    let address = get_server_address(server_node.as_str());
                    poke_server(&address, s_req)?;
                }
                ConsumerRequest::SendToService(sid, req ) => {
                    if source.node != our.node {
                        return Ok(());
                    }
                    if let Some(_service) = consumer.services.get(&sid) {
                        let s_req = ServerRequest::ServiceRequest(sid.clone(), req);
                        let address = get_server_address(sid.clone().node.as_str());
                        poke_server(&address, s_req)?;
                    } else {
                        // dont have this service
                        // TODO maybe tell frontend that it's missing
                    }
                }
                ConsumerRequest::SendToPluginClient(sid, plugin, update) => {
                    if source.node != our.node {
                        return Ok(());
                    }
                    if let Some(service) = consumer.services.get(&sid) {
                        if service.service.metadata.plugins.contains(&plugin) {
                            let update = PluginClientInput::FromFrontend(update.clone());
                            poke_plugin_client(&plugin, &update, &service.service, our)?;
                        }
                    }
                }
            }
        }
        _ => {
        }
    }
    // clean up inactive consumers
    let mut to_kick: HashSet<u32> = HashSet::new();
    // iterate over consumers and remove inactive
    for (id, consumer) in state.client.consumers.iter() {
        const FOUR_MINUTES : u64 = 4*60;
        if (now - consumer.last_active) > FOUR_MINUTES {
            to_kick.insert(id.clone());
        }
    }
    state.client.consumers.retain(|x, _| !to_kick.contains(x));

    // TODO possibly update / kick consumer frontend
    // not important rn because they are most likely already disconnected

    Ok(())
}

fn handle_http_server_request(
    our: &Address,
    state: &mut DartState,
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
            state.client.consumers.insert(
                channel_id,
                Consumer {
                    ws_channel_id: channel_id,
                    services: HashMap::new(),
                    last_active: now,
                },
            );
        }
        HttpServerRequest::WebSocketPush { channel_id, message_type} => {
            if message_type == WsMessageType::Close {
                state.client.consumers.remove(&channel_id);
                return Ok(());
            }
            if message_type != WsMessageType::Binary {
                return Ok(());
            }
            let Some(blob) = get_blob() else {
                return Ok(());
            };

            let Ok(s) = String::from_utf8(blob.bytes.clone()) else {
                return Ok(());
            };

            match serde_json::from_slice(&blob.bytes)? {
                DartMessage::ServerRequest(s_req) => {
                    match handle_server_request(our, state, source.clone(), s_req) {
                        Ok(_) => {}
                        Err(e) => {
                            println!("error handling server request: {:?}", e);
                        }
                    }
                }
                DartMessage::ClientRequest(c_req) => {
                    match c_req {
                        ClientRequest::DeleteConsumer(_num) => {
                            // write down the current channel_id, num inaccurate from the api lib
                            let req = ClientRequest::DeleteConsumer(channel_id);
                            handle_client_request(our, state, source.clone(), req)?;
                        }
                        ClientRequest::ConsumerRequest(_num, inner) => {
                            // write down the current channel_id, num inaccurate from the api lib
                            let req = ClientRequest::ConsumerRequest(channel_id, inner);
                            handle_client_request(our, state, source.clone(), req)?;
                        }
                        _ => {}
                    }
                }
                _ => {}
            }
        }
        HttpServerRequest::WebSocketClose(channel_id) => {
            state.client.consumers.remove(&channel_id);
        }
        HttpServerRequest::Http(_request) => {
        }
    };

    Ok(())
}

fn handle_message(our: &Address, state: &mut DartState) -> anyhow::Result<()> {
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
        match serde_json::from_slice(body)? {
            DartMessage::ServerRequest(s_req) => {
                match handle_server_request(our, state, source.clone(), s_req) {
                    Ok(_) => {}
                    Err(e) => {
                        println!("error handling server request: {:?}", e);
                    }
                }
            }
            DartMessage::ClientRequest(c_req) => {
                if our.node != source.node {
                    // we only send client requests to ourself
                    return Ok(());
                }
                handle_client_request(our, state, source.clone(), c_req)?;
            }
            DartMessage::ClientUpdate(update) => {
                handle_client_update(our, state, &source, update)?;
            }
        }
        Ok(())
    }
}

fn update_all_consumers_with_service_plugin(state: &DartState, update: ConsumerUpdate, service_id: &ServiceId, plugin: &String) {
    for (_id, consumer) in state.client.consumers.iter() {
        if let Some(service) = consumer.services.get(service_id) {
            if service.service.metadata.plugins.contains(plugin) {
                update_consumer(consumer.ws_channel_id, update.clone()).unwrap();
            }
        }
    }
}

fn update_all_consumers (state: &DartState, update: ConsumerUpdate) {
    for (_id, consumer) in state.client.consumers.iter() {
        update_consumer(consumer.ws_channel_id, update.clone()).unwrap();
    }
}

fn update_consumer (
    // state: &DartState,
    websocket_id: u32,
    update: ConsumerUpdate,
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

fn poke_plugin_client (
    plugin: &String,
    update: &PluginClientInput,
    service: &Service,
    our: &Address,
) -> anyhow::Result<()> {
    let address = get_process_address(our.node.as_str(), plugin.as_str());
    let update = PluginMessage::ClientInput(service.clone(), update.clone());
    Request::to(address)
        .body(serde_json::to_vec(&update)?)
        .send()?;

    Ok(())
}

// const IS_FAKE: bool = !cfg!(feature = "prod");
// const SERVER_NODE: &str = if IS_FAKE { "fake.dev" } else { "waterhouse.os" };

fn new_dart_state() -> DartState {
    DartState {
        client: new_client_state(),
        server: new_server_state()
    }
}

call_init!(init);
fn init(our: Address) {
    println!("initializing");
    
    // Serve the index.html and other UI files found in pkg/ui at the root path.
    http::serve_ui(&our, "ui", true, false, vec!["/"]).unwrap();

    // // Allow HTTP requests to be made to /api; they will be handled dynamically.
    // http::bind_http_path("/api", true, false).unwrap();

    // Allow websockets to be opened at / (our process ID will be prepended).
    http::bind_ws_path("/", true, false).unwrap();

    Request::to(("our", "homepage", "homepage", "sys"))
        .body(
            serde_json::json!({
                "Add": {
                    "label": "dartfrog",
                    "icon": constants::HOMEPAGE_IMAGE,
                    "path": "/",
                    // "widget": get_widget(),
                }
            })
            .to_string()
            .as_bytes()
            .to_vec(),
        )
        .send()
        .unwrap();

    // let server = get_server_address(SERVER_NODE);
    let mut state = new_dart_state();

    let drive_path: String = create_drive(our.package_id(), "dartfrog", None).unwrap();
    state.server.drive_path = drive_path;

    // let mut plugins = Vec::new();
    // plugins.push("chat:dartfrog:herobrine.os".to_string());
    // plugins.push("piano:dartfrog:herobrine.os".to_string());
    // poke_server(&our, ServerRequest::CreateService(ServiceId {
    //     node: our.node.clone(),
    //     id: "chat".to_string()
    // }, plugins)).unwrap();

    loop {
        match handle_message(&our, &mut state) {
            Ok(()) => {}
            Err(e) => {
                println!("handle_message error: {:?}", e);
            }
        };
    }
}

fn update_client_consumer(update: ConsumerUpdate, client_node: String) -> anyhow::Result<()> {
    update_client(ClientUpdate::ConsumerUpdate(update), client_node)
}
fn update_client(update: ClientUpdate, client_node: String) -> anyhow::Result<()> {
    let address = get_server_address(&client_node);
    Request::to(address)
        .body(serde_json::to_vec(&DartMessage::ClientUpdate(update))?)
        .send()?;
    Ok(())
}

fn poke_server(address:&Address, req: ServerRequest) -> anyhow::Result<()> {
    Request::to(address)
        .body(serde_json::to_vec(&DartMessage::ServerRequest(req))?)
        .send()?;
    Ok(())
}

fn poke_plugin(address:&Address, poke: &PluginMessage) -> anyhow::Result<()> {
    Request::to(address)
        .body(serde_json::to_vec(poke)?)
        .send()?;
    Ok(())
}