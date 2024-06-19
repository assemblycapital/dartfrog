import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./App.css";
import DartApi, { parseServiceId } from "@dartfrog/puddle";
import { WEBSOCKET_URL } from "./utils";
import useChatStore, { PLUGIN_NAME } from "./store/chat";
import ChatBox from "./components/ChatBox";

function App() {
  const location = useLocation();

  const {api, setApi, serviceId, setServiceId, setChatState, chatState, addChatMessage} = useChatStore();

  useEffect(() => {

    const searchParams = new URLSearchParams(location.search);
    const paramService = searchParams.get("service");

    if (paramService) {
      setServiceId(paramService);
    } else {
      setServiceId(null);
    }

  }, [location.search])

  useEffect(() => {
    if (!serviceId) {
      return;
    }

    let serviceUpdateHandlers = new Map();

    let serviceUpdateHandler = (update) =>{
        handleUpdate(update);
    }

    serviceUpdateHandlers.set(serviceId, serviceUpdateHandler);

    const api = new DartApi({
      our: window.our,
      websocket_url: WEBSOCKET_URL,
      serviceUpdateHandlers: serviceUpdateHandlers,
      onOpen: () => {
        console.log("connected in chat-ui")
        api.joinService(parseServiceId(serviceId));
        setApi(api);
      },
      onClose: () => {
      },
      onServicesChangeHook: (services) => {
        // console.log("got services", services)
      },
      onAvailableServicesChangeHook: (availableServices) => {
      }
    });
  }, [serviceId]);


  const handleUpdate = useCallback(
    (update) => {
      console.log("chat-ui service update", update)
  
      if (!update["PluginUpdate"]) return;
      let [plugin, inner] = update["PluginUpdate"];
  
      if (plugin !== PLUGIN_NAME) return;
  
      let pluginUpdate = JSON.parse(inner);
  
      if (pluginUpdate["Message"]) {
        console.log("got message", pluginUpdate["Message"]);
        const message = pluginUpdate["Message"];
        addChatMessage(message);

  
      } else if (pluginUpdate["FullMessageHistory"]) {
        let newMessages = new Map();
        for (let msg of pluginUpdate["FullMessageHistory"]) {
          newMessages.set(msg.id, {
            id: msg.id,
            from: msg.from,
            msg: msg.msg,
            time: msg.time,
          });
        }
  
        // Updating the state for full message history
        setChatState({ messages: newMessages });
      }
      
    }, [setChatState]); // Assuming setChatState is imported from your Zustand store
   
  
  const sendChat = useCallback(
    (text) => {
      let innerPluginRequest = 
          {
          "SendMessage": 
            text
          }
      api.pokePlugin(serviceId, "chat:dartfrog:herobrine.os", innerPluginRequest);
    }, [api]);


  return (
    <div style={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "0.4rem",
    }}>
      <ChatBox serviceId={serviceId} chatState={chatState} />
    
    </div>
  );
}

export default App;
