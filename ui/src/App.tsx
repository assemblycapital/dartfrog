import "./App.css";
import useChatStore from "./store/chat";

import Footer from "./components/Footer";
import ControlHeader from "./components/ControlHeader";
import { useEffect, useRef, useState } from "react";
import { ConnectionStatusType } from "./types/types";
import ServerBox from "./components/ServerBox";
import { WEBSOCKET_URL, } from './utils';
import KinodeClientApi from "@kinode/client-api";
import DartApi from "./dartclientlib/";

function App() {

  const [nodeConnected, setNodeConnected] = useState(false);

  const {setApi, handleUpdate} = useChatStore();

  useEffect(() => {
    let api = new DartApi(handleUpdate);
    setApi(api);
  }, []);

  const [isServerDisconnected, setIsServerDisconnected] = useState(true);

  // useEffect(() => {
  //   if (!serverStatus) return;
  //   if (!serverStatus.connection) return;
  //   if (serverStatus.connection.type === ConnectionStatusType.Disconnected) {
  //     setIsServerDisconnected(true);
  //   } else {
  //     setIsServerDisconnected(false);
  //   }

  // }, [serverStatus]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // pokeUnsubscribe();
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
          }}
        >
          todo
        </div>
      ) : (
        <ServerBox />
      )}

      <Footer />
    </div>
  );
}


export default App;
