use kinode_process_lib::{call_init, println, Address,
};

wit_bindgen::generate!({
    path: "wit",
    world: "process",
});

call_init!(init);
fn init(_our: Address) {
    println!("initializing chat process!");
}
