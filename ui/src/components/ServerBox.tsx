import DisplayUserActivity from "./DisplayUserActivity";
import useChatStore from "../store/chat";

import ChatBox from "./ChatBox";
import ChatHeader from "./ChatHeader";
import { ConnectionStatusType, ServerStatus } from "../types/types";
import { useEffect } from "react";
import Spinner from "./Spinner";
import useDartStore from "../store/dart";
import { ServiceConnectionStatus, ServiceConnectionStatusType } from "../dartclientlib";

function ServerBox() {
  const { services } = useDartStore();
  // const { chats, serverStatus } = useChatStore();
  if (!(services instanceof Map)) {
    return <div>Error: services is not a Map</div>;
  }

  function stringifyServiceConnectionStatus(status: ServiceConnectionStatusType): string {
    switch (status) {
      case ServiceConnectionStatusType.Connecting:
        return "Connecting";
      case ServiceConnectionStatusType.Connected:
        return "Connected";
      case ServiceConnectionStatusType.Disconnected:
        return "Disconnected";
      case ServiceConnectionStatusType.ServiceDoesNotExist:
        return "ServiceDoesNotExist";
      default:
        return "Unknown Status";
    }
  }
    
  function renderConnectionStatus(status: ServiceConnectionStatus) {
    
    let time = formatTimeStamp(status.timestamp);
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "0.8rem",
          alignItems: "center",
          alignContent: "center",
          textAlign: "center",
          color: "#ffffff55",
        }}
      >
        <span>{stringifyServiceConnectionStatus(status.status)}</span>
        <span>{time}</span>
      </div>
    )
  }
  return (
    <div>
    
      <div
        style={{
          fontWeight: "bold",
        }}
      >
        services:
      </div>
      {Array.from(services.entries()).map(([serviceId, service]) => (
        <div key={serviceId}
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div>{serviceId}</div>
          {renderConnectionStatus(service.connectionStatus)}
          <div>
            <div>Subscribers:</div>
            {service.metadata.subscribers.map((subscriber) => (
              <div key={subscriber.client_node + subscriber.ws_channel_id}>
                {subscriber.client_node} {subscriber.ws_channel_id}
                </div>
              ))}
          </div>
          <div>
            <div>User Presence:</div>
            {Object.entries(service.metadata.user_presence).map(([key, presence]) => (
                <div key={key}>
                    <p>User ID: {key}</p>
                    <p>Time: {presence.time}</p>
                    <p>Was Online: {presence.was_online_at_time ? 'Yes' : 'No'}</p>
                </div>
            ))}
          </div>
          {/* Render other service details here */}
        </div>
      ))}
    </div>
  );

  // if (!serverStatus || serverStatus.connection.type === ConnectionStatusType.Disconnected) {
  //   // this flashes on screen for an instant on disconnect due to some slight misorganization of state
  //   return (
  //     <div
  //       style={{
  //         height: "400px",
  //       }}
  //     >
  //       {/* server not connected... please refresh */}
  //     </div>
  //   );
  // }
  // if (serverStatus.connection.type === ConnectionStatusType.Connecting) {
  //   return (
  //       <div
  //         style={{
  //           display: "flex",
  //           flexDirection: "column",
  //           gap: "0.8rem",
  //         }}
  //       >
  //         <ChatHeader />
  //         <div
  //            style={{
  //             height: '400px',
  //             alignItems: 'center',
  //             alignContent: 'center',
  //             textAlign: 'center',
  //            }}
  //         >
  //           <Spinner />
  //         </div>
  //       </div>
  //   );
  // }

  // return (
  //       <div
  //         style={{
  //           display: "flex",
  //           flexDirection: "column",
  //           gap: "0.8rem",
  //         }}
  //       >
  //         <ChatHeader />
  //         <ChatBox chats={chats} />
  //         <DisplayUserActivity />
  //       </div>
  // );
}


export default ServerBox;

function formatTimeStamp(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString();
}
