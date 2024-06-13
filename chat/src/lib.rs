use common::{new_chat_state, ChatState, PluginInput, PluginMetadata, PluginOutput, Service, ServiceId};
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

fn handle_message(our: &Address, _state: &mut ChatState, meta: &mut Option<PluginMetadata>) -> anyhow::Result<()> {
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
                println!("child received init message");
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
                // println!("received kill message");
                // response doesn't get out before we exit...
                // Response::new()
                //     .body(serde_json::to_vec(&PluginOutput::ShuttingDown).unwrap())
                //     .send().unwrap();
                return Err(anyhow::anyhow!("kill message received"));
            }
            PluginInput::ClientRequest(from, _req) => {
                println!("inside chat module client request: {:?}", from);
            }
            PluginInput::ClientJoined(from) => {
                println!("inside chat module client joined: {:?}", from);
            }
            PluginInput::ClientExited(from) => {
                println!("client exit: {:?}", from);
            }
            _ => {}
        }
    }

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
