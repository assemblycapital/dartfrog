import { useCallback, useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./App.css";
import DartApi, { parseServiceId } from "@dartfrog/puddle";
import { WEBSOCKET_URL, maybePlaySoundEffect, maybePlayTTS } from "./utils";
import useChatStore, { PLUGIN_NAME } from "./store/chat";
import ChatBox from "./components/ChatBox";
import ChatInput from "./components/ChatInput";

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
    const api = new DartApi({
      our: window.our,
      websocket_url: WEBSOCKET_URL,
      pluginUpdateHandler: {
          plugin:PLUGIN_NAME,
          serviceId,
          handler:(pluginUpdate, service) => {
            if (pluginUpdate["Message"]) {
              const message = pluginUpdate["Message"];
              maybePlaySoundEffect(message.msg);
              maybePlayTTS(message.msg);
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
        
              setChatState({ messages: newMessages, lastUpdateType: "history" });
            }
          }
        },
      onOpen: () => {
        api.joinService(serviceId);
        setApi(api);
        setChatState({ messages: new Map(), lastUpdateType: "history" });
      },
      onClose: () => {
      },
    });

  }, [serviceId]);


  if (!(chatState.messages instanceof Map)) {
    return <div>Loading...</div>;
  }

  return (
    <ChatBox serviceId={serviceId} chatState={chatState} />
  );
}

export default App;
