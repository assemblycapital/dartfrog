import { useState, useEffect, useCallback, useRef, Fragment} from "react";
import KinodeClientApi from "@kinode/client-api";
import "./App.css";
import ChatMessageList from "./components/ChatMessageList";
import ChatInput from "./components/ChatInput";
import DisplayUserActivity from "./components/DisplayUserActivity";
import useChatStore from "./store/chat";

import {WEBSOCKET_URL, pokeSubscribe} from "./utils";

function App() {
  const [nodeConnected, setNodeConnected] = useState(false);
  const { chats, setApi, handleWsMessage } = useChatStore();

  useEffect(() => {
    // Connect to the Kinode via websocket
    if (window.our?.node && window.our?.process) {
      const api = new KinodeClientApi({
        uri: WEBSOCKET_URL,
        nodeId: window.our.node,
        processId: window.our.process,
        onClose: (_event) => {
          console.log("Disconnected from Kinode");
          setNodeConnected(false);
        },
        onOpen: (_event, _api) => {
          console.log("Connected to Kinode");
          setNodeConnected(true);
          pokeSubscribe();
        },
        onMessage: (json, _api) => {
          handleWsMessage(json);
        },
        onError: (ev) => {
          console.log("kinode connection error", ev);
        },
      });

      setApi(api);
    } else {
      setNodeConnected(false);
    }
  }, []);

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);
  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#ffffff88",
        }}
      >
        <span style={{fontFamily:"monospace", flexGrow: 1}}>
          {time.toLocaleString()}
        </span>
        <div>
          {nodeConnected ? 'connected': 'connecting...'}
        </div>
      </div>
      <ChatMessageList chats={chats} />
      <ChatInput />
      <DisplayUserActivity />
    </div>
  );
}

export default App;
