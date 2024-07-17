use dartfrog_lib::*;
use kinode_process_lib::{call_init, http, Address};

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});

call_init!(init);
fn init(our: Address) {
    println!("init chat");
    let mut state: ProviderState = ProviderState::new();

    let try_ui = http::secure_serve_ui(&our, "chat-ui", vec!["/"]);
    http::secure_bind_ws_path("/", true).unwrap();

    match try_ui {
        Ok(()) => {}
        Err(e) => {
            println!("chat.wasm error starting ui: {:?}", e)
        }
    };

    loop {
        match provider_handle_message(&our, &mut state) {
            Ok(()) => {}
            Err(e) => {
                println!("chat.wasm error handling message: {:?}", e)
            }
        };
    }
}