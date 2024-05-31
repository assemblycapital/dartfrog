import DisplayUserActivity from "./DisplayUserActivity";
import useChatStore from "../store/chat";

import ChatBox from "./ChatBox";
import ChatHeader from "./ChatHeader";
import { ConnectionStatusType, ServerStatus } from "../types/types";
import { useEffect } from "react";
import Spinner from "./Spinner";

function ServerBox() {
  const { chats, serverStatus } = useChatStore();

  if (!serverStatus || serverStatus.connection.type === ConnectionStatusType.Disconnected) {
    // this flashes on screen for an instant on disconnect due to some slight misorganization of state
    return (
      <div
        style={{
          height: "400px",
        }}
      >
        {/* server not connected... please refresh */}
      </div>
    );
  }
  if (serverStatus.connection.type === ConnectionStatusType.Connecting) {
    return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.8rem",
          }}
        >
          <ChatHeader />
          <div
             style={{
              height: '400px',
              alignItems: 'center',
              alignContent: 'center',
              textAlign: 'center',
             }}
          >
            <Spinner />
          </div>
        </div>
    );
  }

  return (
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
  );
}


export default ServerBox;
