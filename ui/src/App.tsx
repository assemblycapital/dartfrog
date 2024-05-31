import "./App.css";
import DisplayUserActivity from "./components/DisplayUserActivity";
import useChatStore from "./store/chat";

import ChatBox from "./components/ChatBox";
import Footer from "./components/Footer";
import ControlHeader from "./components/ControlHeader";
import ChatHeader from "./components/ChatHeader";
import { useEffect, useState } from "react";
import { ConnectionStatusType } from "./types/types";
import { pokeSubscribe } from "./utils";

function App() {
  const { chats, serverStatus } = useChatStore();
  const [isServerConnected, setIsServerConnected] = useState(false);
  useEffect(() => {
    if (!serverStatus) return;
    if (!serverStatus.connection) return;
    if (serverStatus.connection.type === ConnectionStatusType.Connected) {
      setIsServerConnected(true);
    } else if (serverStatus.connection.type === ConnectionStatusType.Disconnected) {
      setIsServerConnected(false);
    }

  }, [serverStatus]);
  

  return (
    <div style={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "0.8rem",
     }}>

      <ControlHeader />

      {!isServerConnected ? (
        <div
          style={{
            height: '400px',
            alignItems: 'center',
            alignContent: 'center',
            textAlign: 'center',
          }}
        >
          <button
            onClick={() => {pokeSubscribe()}}
          >
            connect to server
          </button>
        </div>
      ) : ( 
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.8rem",
          }}
        >
          <ChatHeader />
          <ChatBox chats={chats} />
          <DisplayUserActivity />
        </div>
      )}

      <Footer />
    </div>
  );
}


export default App;
