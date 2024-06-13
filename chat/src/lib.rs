use std::time::{SystemTime, UNIX_EPOCH};

use common::{get_server_address, new_chat_state, ChatMessage, ChatRequest, ChatState, ChatUpdate, DartMessage, PluginInput, PluginMetadata, PluginOutput, ServerRequest, Service, ServiceId, ServiceRequest, PROCESS_NAME};
use kinode_process_lib::{await_message, call_init, println, vfs::open_file, Address, Response, Request
};

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});

fn read_service(drive_path: &String, service_id: &ServiceId) -> anyhow::Result<()> {
    let service_name = service_id.id.clone();
    let file_path = format!("{}/{}.service.txt", drive_path, service_name);
    let file = open_file(&file_path, true, None);
    match file {
        Ok(file) => {
            let bytes = file.read()?;
            let Ok(service) = serde_json::from_slice::<Service>(&bytes) else {
                // Fail silently if we can't parse the request
                return Ok(())
            };
            // println!("read service: {:?}", service);
        }
        Err(e) => {
            println!("error reading service metadata: {:?}", e);
        }
    }
    Ok(())
}

fn handle_message(our: &Address, state: &mut ChatState, meta: &mut Option<PluginMetadata>) -> anyhow::Result<()> {
    let message = await_message()?;

    // println!("child received message: {:?}", message);
    let body = message.body();
    let source = message.source();
    if !message.is_request() {
        println!("unexpected response");
        return Ok(());
        // return Err(anyhow::anyhow!("unexpected Response: {:?}", message));
    }
    if message.source().node != our.node {
        // TODO also check source process?
        // return Err(anyhow::anyhow!("unexpected source: {:?}", source));
        println!("unexpected source: {:?}", source);
        return Ok(());
    }
    if meta.is_none() {
        // need to init before using
        match serde_json::from_slice(body)? {
            PluginInput::Kill => {
                // println!("child received kill message");
                return Err(anyhow::anyhow!("kill message received"));
            }

            PluginInput::Init(init) => {
                // println!("child received init message");
                // println!("received init message: {:?}", init);
                *meta = Some(init);
            }
            _ => {

            }
        }
    }

    if let Some(meta) = meta {
        read_service(&meta.drive_path, &meta.service.id)?;

        match serde_json::from_slice(body)? {
            PluginInput::Kill => {
                return Err(anyhow::anyhow!("kill message received"));
            }
            PluginInput::ClientRequest(from, req) => {
                handle_client_request(our, state, meta, from, req)?;
            }
            PluginInput::ClientJoined(from) => {
                let chat_history = ChatUpdate::FullMessageHistory(state.messages.clone());
                update_client(our, from, chat_history, meta)?;
            }
            PluginInput::ClientExited(from) => {
            }
            _ => {}
        }
    }

    Ok(())
}

fn handle_client_request(our: &Address, state: &mut ChatState, meta: &PluginMetadata, from: String, req: String) -> anyhow::Result<()> {
    let Ok(request) = serde_json::from_str::<ChatRequest>(&req) else {
        println!("error parsing request: {:?}", req);
        return Ok(());
    };
    // println!("chat module: client request: {:?}", request);
    match request {
        ChatRequest::SendMessage(msg) => {
            let chat_msg = ChatMessage {
                id: state.last_message_id,
                time: SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                from: from.clone(),
                msg: msg,
            };

            if state.messages.len() > 64 {
                state.messages = state.messages.split_off(state.messages.len() - 64);
            }

            state.last_message_id += 1;
            state.messages.push(chat_msg.clone());
            let chat_upd = ChatUpdate::Message(chat_msg.clone());
            update_subscribers(our, chat_upd, meta)?;
        }
    }
    Ok(())
}

fn update_client(our: &Address, to: String, update: ChatUpdate, meta: &PluginMetadata) -> anyhow::Result<()> {
    let update = serde_json::to_string(&update).unwrap();
    let address = get_server_address(&our.node);
    let dart_message = 
        DartMessage::ServerRequest(ServerRequest::ServiceRequest(meta.service.id.clone(), ServiceRequest::PluginOutput(meta.plugin_name.clone(), PluginOutput::UpdateClient(to, update))));
    let _ = Request::to(address)
        .body(serde_json::to_vec(&dart_message).unwrap())
        .send()?;
    Ok(())
}
fn update_subscribers(our: &Address, update: ChatUpdate, meta: &PluginMetadata) -> anyhow::Result<()> {
    let update = serde_json::to_string(&update).unwrap();
    let address = get_server_address(&our.node);
    let dart_message = 
        DartMessage::ServerRequest(ServerRequest::ServiceRequest(meta.service.id.clone(), ServiceRequest::PluginOutput(meta.plugin_name.clone(), PluginOutput::UpdateSubscribers(update))));
    let _ = Request::to(address)
        .body(serde_json::to_vec(&dart_message).unwrap())
        .send()?;
    Ok(())
}



call_init!(init);
fn init(our: Address) {
    // println!("initializing child process. our: {:?}", our);
    let mut meta: Option<PluginMetadata> = None;
    let mut state: ChatState = new_chat_state();
    loop {
        match handle_message(&our, &mut state, &mut meta) {
            Ok(()) => {}
            Err(e) => {
                if e.to_string().contains("kill message received") {
                    println!("{:?} shutting down", our.process.process_name);
                    break;
                }
                // println!("chat.wasm handle_message error: {:?}", e);
            }
        };
    }
}
