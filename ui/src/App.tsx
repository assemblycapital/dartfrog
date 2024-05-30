import { useState, useEffect, useCallback, useRef, Fragment} from "react";
import KinodeClientApi from "@kinode/client-api";
import "./App.css";
import DisplayUserActivity from "./components/DisplayUserActivity";
import useChatStore from "./store/chat";

import {WEBSOCKET_URL, pokeSubscribe} from "./utils";
import ChatBox from "./components/ChatBox";

function App() {
  const [nodeConnected, setNodeConnected] = useState(false);
  const { muteSoundEffects, setMuteSoundEffects, chats, setApi, handleWsMessage, bannedUsers } = useChatStore();

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
    <div style={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "0.8rem",


     }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#ffffff55",
          fontSize: "0.8rem",
        }}
      >
        <span style={{
          // fontFamily:"monospace",
          flexGrow: 1,
          fontSize: "0.7rem"
          }}
        >
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
      <ChatBox chats={chats} />
      <DisplayUserActivity />
      <div 
        style={{
          fontSize: "0.8rem",
        }}
      >
        <button onClick={() => {
            if(muteSoundEffects) {
              setMuteSoundEffects(false);
            } else {
              setMuteSoundEffects(true);
            }
          }}
          style={{
            opacity: "0.5",
          }}
          >
          {muteSoundEffects ? 'Unmute' : 'Mute'}
        </button>
      </div>
      <div
        style={{
          fontSize: "0.8rem",
          color: "#ffffff44",
          cursor: "default",
          display: "flex",
          flexDirection: "row",
          gap: "1rem",
        }}
      >
      <div
        style={{
          display: "inline-block",
          alignContent: "flex-end",
        }}
      >
        <svg style={{
            width: "32",
            height: "32",
            fill: "none",
            opacity: "0.2",
          }}
          viewBox="0 0 388 194"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M194 0H97V97H0V194H97V97H194H291V194H388V97H291V0H194Z" fill="white" />
        </svg>
      </div>

        <span
          style={{
            alignContent: "center",
          }}
        >
          For help, contact a.cow on Discord.
          If you're having trouble, you may need to update your app version.
        </span>
      </div>
    </div>
  );
}


export default App;
