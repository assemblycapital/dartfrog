import { useEffect } from "react";
import "./App.css";
import DartApi from "@dartfrog/puddle";
import { WEBSOCKET_URL } from "./utils";

function App() {

  useEffect(() => {
    const api = new DartApi({
      our: window.our,
      websocket_url: WEBSOCKET_URL,
      serviceUpdateHandlers: new Map(),
      onOpen: () => {

        console.log("connected")
      },
      onClose: () => {
      },
      onServicesChangeHook: (services) => {
        console.log("got services", services)
      },
      onAvailableServicesChangeHook: (availableServices) => {
      }
    });
  }, []);


  return (
    <div style={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "0.4rem",
    }}>
      <div>
        todo chat ui
      </div>
    </div>
  );
}


export default App;
