import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./App.css";
import DartApi, { parseServiceId } from "@dartfrog/puddle";
import { WEBSOCKET_URL } from "./utils";

function App() {
  const location = useLocation();

  const [service, setService] = useState<string | null>(null);

  const [api, setApi] = useState<DartApi | null>(null);

  useEffect(() => {

    const searchParams = new URLSearchParams(location.search);
    const service = searchParams.get("service");

    if (service) {
      setService(service);
    } else {
      setService(null);
    }

  }, [location.search])

  useEffect(() => {
    if (!service) {
      return;
    }

    let serviceUpdateHandlers = new Map();

    let serviceUpdateHandler = (update) =>{
      console.log("chat-ui service update", update)
    }

    serviceUpdateHandlers.set(service, serviceUpdateHandler);

    const api = new DartApi({
      our: window.our,
      websocket_url: WEBSOCKET_URL,
      serviceUpdateHandlers: serviceUpdateHandlers,
      onOpen: () => {
        console.log("connected in chat-ui")
        api.joinService(parseServiceId(service));
        setApi(api);
      },
      onClose: () => {
      },
      onServicesChangeHook: (services) => {
        console.log("got services", services)
      },
      onAvailableServicesChangeHook: (availableServices) => {
      }
    });
  }, [service]);

  
  const sendChat = useCallback(
    (text) => {
      let innerPluginRequest = 
          {
          "SendMessage": 
            text
          }
      api.pokePlugin(service, "chat:dartfrog:herobrine.os", innerPluginRequest);
    }, [api]);


  return (
    <div style={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "0.4rem",
    }}>
    
      <button onClick={() => {
        sendChat("dummy chat")
      }}>dummy chat</button>
    </div>
  );
}

export default App;
