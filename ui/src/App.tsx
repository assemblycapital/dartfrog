import "./App.css";
import useChatStore from "./store/chat";

import Footer from "./components/Footer";
import ControlHeader from "./components/ControlHeader";
import { useEffect, useRef, useState } from "react";
import { ConnectionStatusType } from "./types/types";
import ServerBox from "./components/ServerBox";
import { WEBSOCKET_URL, pokeSubscribe, pokeUnsubscribe } from './utils';
import KinodeClientApi from "@kinode/client-api";

function App() {
  const { serverStatus, setApi, handleWsMessage } = useChatStore();

  const [nodeConnected, setNodeConnected] = useState(false);
  const reconnectIntervalRef = useRef(null);

  useEffect(() => {
    const connectToKinode = () => {
      console.log("Attempting to connect to Kinode...");
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
            console.log("Kinode connection error", ev);
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
        reconnectIntervalRef.current = setInterval(connectToKinode, 5 * 1000);
      }
    }

    return () => {
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
      }
    };
  }, [nodeConnected]);

  const [isServerDisconnected, setIsServerDisconnected] = useState(true);

  useEffect(() => {
    if (!serverStatus) return;
    if (!serverStatus.connection) return;
    if (serverStatus.connection.type === ConnectionStatusType.Disconnected) {
      setIsServerDisconnected(true);
    } else {
      setIsServerDisconnected(false);
    }

  }, [serverStatus]);
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      pokeUnsubscribe();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  useEffect(() => {
    // when the user presses a key a-z, focus #chat-input
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.match(/[a-z]/i)) {
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
          chatInput.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div style={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "0.8rem",
    }}>

      <ControlHeader nodeConnected={nodeConnected} />

      {isServerDisconnected ? (
        <div
          style={{
            height: '400px',
            alignItems: 'center',
            alignContent: 'center',
            textAlign: 'center',
          }}
        >
          <button
            onClick={() => { pokeSubscribe() }}
          >
            connect to server
          </button>
        </div>
      ) : (
        <ServerBox />
      )}

      <Footer />
    </div>
  );
}


export default App;
