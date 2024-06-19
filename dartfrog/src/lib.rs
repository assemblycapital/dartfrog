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
    // println!("server request: {:?}", req);
    match req {
        ServerRequest::ServiceRequest(service_id, service_request) => {
            handle_service_request(our, state, source, service_id, service_request)?;
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
                    service.metadata.plugins.insert(plugin.clone());

                    let plugin_address = get_plugin_address(plugin.as_str(), our.node());
                    // TODO vfs for plugin metadata sharing
                    let plugin_metadata = PluginMetadata {
                        plugin_name: plugin.clone(),
                        drive_path: "todo".to_string(),
                        service: service.clone(),
                    };
                    poke_plugin(&plugin_address, &PluginMessage::ServiceInput(service_id.id.clone(), PluginServiceInput::Init(plugin_metadata)))?;
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
                    update_client(update, subscriber)?;
                }
                for plugin in service.metadata.plugins.clone() {
                    let address = get_plugin_address(&plugin, our.node.as_str());
                    poke_plugin(&address, &PluginMessage::ServiceInput(service_id.id.clone(), PluginServiceInput::Kill))?;
                }
                state.server.services.remove(&service_id.id.clone());
            }

        }
        ServerRequest::RequestServiceList => {
            let services: Vec<ServiceId> = state.server.services.keys().map(|x| ServiceId {
                node: our.node.clone(),
                id: x.clone()
            }).collect();
            let update = ConsumerUpdate::FromServer(our.node.clone(), ConsumerServerUpdate::ServiceList(services));
            update_client(update, source.node.clone())?;
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
            file.set_len(bytes.len() as u64)?;
            file.write_all(metadata.as_bytes())?;
        }
        Err(e) => {
            println!("error writing service metadata: {:?}", e);
        }
    }
    Ok(())
}

fn poke_plugins(service:&Service, poke: PluginServiceInput, our: &Address) -> anyhow::Result<()> {
    for plugin in service.metadata.plugins.clone() {

        let address = get_plugin_address(plugin.as_str(), our.node.as_str());
        poke_plugin(&address, &PluginMessage::ServiceInput(service.id.id.clone(), poke.clone()))?;
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
            ServiceRequest::PluginOutput(plugin_name, plugin_out) => {
                if service.metadata.plugins.contains(&plugin_name) {

                    // println!("plugin output: {:?} {:?}", plugin_name, plugin_out);
                    let plugin_address = get_plugin_address(&plugin_name, our.node.as_str());
                    if source != plugin_address {
                        // no spoofing
                        println!("spoofing attempt: {:?} {:?}", source, plugin_address);
                        return Ok(());
                    }

                    match plugin_out {
                        PluginServiceOutput::UpdateSubscribers(update) => {
                            let wrap_update = ConsumerUpdate::FromService(service_id.node.clone(), service_id.id.clone(), ConsumerServiceUpdate::PluginUpdate(plugin_name, update));
                            update_subscribers(wrap_update, service.metadata.subscribers.clone())?;
                        }
                        PluginServiceOutput::UpdateClient(to, update) => {
                            let wrap_update = ConsumerUpdate::FromService(service_id.node.clone(), service_id.id.clone(), ConsumerServiceUpdate::PluginUpdate(plugin_name, update));
                            update_client(wrap_update, to)?;
                        }
                        _ => {
                        }
                    }
                }
            }
            ServiceRequest::PluginRequest(plugin_name, plugin_req) => {
                if service.metadata.plugins.contains(&plugin_name) {
                    let plugin_address = get_plugin_address(&plugin_name, our.node.as_str());
                    poke_plugin(&plugin_address, &PluginMessage::ServiceInput(service.id.id.clone(), PluginServiceInput::ClientRequest(source.node.clone(), plugin_req)))?;
                }
            }
            ServiceRequest::Subscribe => {
                if !service.metadata.subscribers.contains(&source.node.clone()) {
                    // already subscribed, continue anyways
                }
                service.metadata.subscribers.insert(source.node.clone());
                service.metadata.user_presence.insert(source.node.clone(), Presence {
                    time: SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs(),
                });
                write_service(state.server.drive_path.clone(), service)?;
                poke_plugins(&service, PluginServiceInput::ClientJoined(source.node.clone()), our)?;
                let ack = make_consumer_service_update(service_id.clone(), ConsumerServiceUpdate::SubscribeAck);
                let meta = make_consumer_service_update(service_id.clone(), ConsumerServiceUpdate::ServiceMetadata(service.metadata.clone()));
                update_client(ack, source.node.clone())?;
                update_subscribers(meta, service.metadata.subscribers.clone())?;
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
                if (now - service.last_sent_presence) < 1*60 {
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
                        update_client(update, user.clone())?;
                        poke_plugins(&service, PluginServiceInput::ClientExited(source.node.clone()), our)?;
                    }
                }
                service.metadata.subscribers.retain(|x| !to_kick.contains(x));

                // send metadata update
                service.last_sent_presence = SystemTime::now()
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
        update_client(update, source.node.clone())?;
    }
    Ok(())
}

fn update_subscribers(update: ConsumerUpdate, subscribers: HashSet<String>) -> anyhow::Result<()> {
    for subscriber in subscribers {
        update_client(update.clone(), subscriber)?;
    }
    Ok(())
}

fn handle_client_update(our: &Address, state: &mut DartState, source: Address, upd: ClientUpdate) -> anyhow::Result<()> {
    // println!("client update: {:?}", upd);
    match upd {
        ClientUpdate::FromPlugin(plugin_update) => {
            // handle the request
            if source.node != our.node {
                return Ok(());
            }
            match plugin_update {
                PluginConsumerOutput::UpdateClient(service_id, update) => {
                    if let Some(plugin) = source.to_string().split('@').nth(1) {
                        println!("client plugin update: {:?} {:?}", service_id, plugin);
                        update_all_consumers_with_service_plugin(state, update, &service_id, &plugin.to_string());
                    }
                    
                }
            }

        }
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
                                service.metadata = metadata.clone();
                                service.connection = ConnectionStatus::Connected(
                                    SystemTime::now()
                                        .duration_since(UNIX_EPOCH)
                                        .unwrap()
                                        .as_secs(),
                                );
                                update_consumer(consumer.ws_channel_id, consumer_update.clone())?;
                            }
                            ConsumerServiceUpdate::PluginUpdate(ref plugin, ref upd) => {
                                if sent_to_plugin {
                                    // don't duplicate updates
                                    continue;
                                }
                                let service = consumer.services.get_mut(&service_id).unwrap();
                                if service.metadata.plugins.contains(plugin) {
                                    sent_to_plugin = true;
                                    update_consumer_plugin(plugin, upd, &service_id, our)?;
                                }
                            }
                            _ => {
                            }
                        }
                    }
                }
                _ => {
                }
            }
        }
    }
    Ok(())
}

fn handle_client_request(our: &Address, state: &mut DartState, _source: Address, req: ClientRequest) -> anyhow::Result<()> {
    // println!("client request: {:?}", req);
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    match req {
        ClientRequest::DeleteConsumer(num) => {

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
                // println!("deleting consumer");
                state.client.consumers.remove(&num);
            }
        }
        ClientRequest::ConsumerRequest(num, inner) => {
            let Some(consumer) = state.client.consumers.get_mut(&num) else {
                // println!("no consumer found {:?} {:?}", num, inner);
                return Ok(());
            };
            // println!("consumer request: {:?} {:?}", num, inner);
            consumer.last_active = now;

            match inner {
                ConsumerRequest::JoinService(sid) => {
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
                        let update = ConsumerUpdate::FromClient(ConsumerClientUpdate::Todo("clientmodule created your service, poking server".to_string()));
                        update_consumer(num, update)?;
                    }
                }
                ConsumerRequest::ExitService(sid) => {
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
                    if let Some(_service) = consumer.services.get(&sid) {
                        let s_req = ServerRequest::ServiceRequest(sid.clone(), req);
                        let address = get_server_address(sid.clone().node.as_str());
                        poke_server(&address, s_req)?;
                    } else {
                        // dont have this service
                        // TODO maybe tell frontend that it's missing
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
            // println!("WebSocketOpen: {:?}", channel_id);
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
                println!("unexpected ws push type: {:?}", message_type);
                return Ok(());
            }
            let Some(blob) = get_blob() else {
                return Ok(());
            };

            let Ok(s) = String::from_utf8(blob.bytes.clone()) else {
                println!("error parsing utf8 ws push");
                return Ok(());
            };

            match serde_json::from_slice(&blob.bytes)? {
                DartMessage::ServerRequest(s_req) => {
                    handle_server_request(our, state, source.clone(), s_req)?;
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
                        _ => {
                            println!("unexpected client request: {:?}", c_req);
                        }
                    }
                }
                _ => {
                    println!("unexpected Request: {:?}", s)
                    // return Err(anyhow::anyhow!("unexpected Request: {:?}", s));
                }
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
        // println!("http_server request: {:?}", message);
        handle_http_server_request(our, state, source, body)
    } else {
        match serde_json::from_slice(body)? {
            DartMessage::ServerRequest(s_req) => {
                // println!("server request: {:?}", message);
                handle_server_request(our, state, source.clone(), s_req)?;
            }
            DartMessage::ClientRequest(c_req) => {
                if our.node != source.node {
                    // we only send client requests to ourself
                    return Ok(());
                }
                // println!("client request: {:?}", message);
                handle_client_request(our, state, source.clone(), c_req)?;
            }
            DartMessage::ClientUpdate(s_upd) => {
                // println!("client update: {:?}", message);
                handle_client_update(our, state, source.clone(), s_upd)?;
            }
        }
        Ok(())
    }
}

fn update_all_consumers_with_service_plugin (state: &DartState, update: String, service_id: &ServiceId, plugin: &String) {
    for (_id, consumer) in state.client.consumers.iter() {
        if let Some(service) = consumer.services.get(service_id) {
            if service.metadata.plugins.contains(plugin) {
                let update = ConsumerUpdate::FromService(service_id.node.clone(), service_id.id.clone(), ConsumerServiceUpdate::PluginUpdate(plugin.clone(), update.clone()));
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

fn update_consumer_plugin (
    plugin: &String,
    update: &String,
    service_id: &ServiceId,
    our: &Address,
) -> anyhow::Result<()> {
    let address = get_process_address(our.node.as_str(), plugin.as_str());

    let update = PluginMessage::ConsumerInput(service_id.clone(), PluginConsumerInput::ServiceUpdate(update.clone()));

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

    let mut plugins = Vec::new();
    plugins.push("chat:dartfrog:herobrine.os".to_string());
    poke_server(&our, ServerRequest::CreateService(ServiceId {
        node: our.node.clone(),
        id: "chat".to_string()
    }, plugins)).unwrap();

    loop {
        match handle_message(&our, &mut state) {
            Ok(()) => {}
            Err(e) => {
                println!("handle_message error: {:?}", e);
            }
        };
    }
}

fn update_client(update: ConsumerUpdate, client_node: String) -> anyhow::Result<()> {
    let address = get_server_address(&client_node);
    Request::to(address)
        .body(serde_json::to_vec(&DartMessage::ClientUpdate(ClientUpdate::ConsumerUpdate(update)))?)
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
    // println!("poking plugin");
    Request::to(address)
        .body(serde_json::to_vec(poke)?)
        .send()?;
    Ok(())
}