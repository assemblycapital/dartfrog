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
  const { chats, setApi, handleWsMessage, bannedUsers } = useChatStore();

  const reconnectIntervalRef = useRef(null);

  useEffect(() => {
    const connectToKinode = () => {
      console.log("attempting to connect to Kinode...");
      if (window.our?.node && window.our?.process) {
        const newApi = new KinodeClientApi({
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
            setNodeConnected(false);
          },
        });

        setApi(newApi);
      } else {
        setNodeConnected(false);
      }
    };

    if (nodeConnected) {
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
    } else {
      connectToKinode(); // Attempt to connect immediately on load
      if (!reconnectIntervalRef.current) {
        reconnectIntervalRef.current = setInterval(connectToKinode, 5*1000);
      }
    }

    return () => {
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
      }
    };
  }, [nodeConnected]);


  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    setIsBanned(bannedUsers.includes(window.our?.node));
  }, [bannedUsers]);


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
          {time.toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              weekday: 'short',
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
        </span>

        {isBanned && 
          <div style={{color:"red", marginRight:"5px"}}>
            you are banned from chatting.
          </div>
        }

        <div>
          {nodeConnected ? 'connected': 'connecting...'}
        </div>
      </div>
      <ChatMessageList chats={chats} />
      <ChatInput />
      <DisplayUserActivity />
      <div
        style={{
          fontSize: "0.8rem",
          color: "#ffffff44",
          marginTop: "3rem",
        }}
      >
        <p>
          help: contact a.cow on Discord.
          if you're having trouble, you may need to update your app version.
        </p>
      </div>
    </div>
  );
}

export default App;
