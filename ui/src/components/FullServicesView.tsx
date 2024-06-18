import DisplayUserActivity from "./DisplayUserActivity";

import ChatBox from "./ChatBox";
import ChatHeader from "./ChatHeader";
import { useEffect } from "react";
import Spinner from "./Spinner";
import useDartStore from "../store/dart";
import { ServiceConnectionStatus, ServiceConnectionStatusType } from "@dartfrog/puddle";

export function stringifyServiceConnectionStatus(status: ServiceConnectionStatusType): string {
  switch (status) {
    case ServiceConnectionStatusType.Connecting:
      return "Connecting";
    case ServiceConnectionStatusType.Connected:
      return "Connected";
    case ServiceConnectionStatusType.Disconnected:
      return "Disconnected";
    case ServiceConnectionStatusType.ServiceDoesNotExist:
      return "ServiceDoesNotExist";
    case ServiceConnectionStatusType.Kicked:
      return "Kicked";
    default:
      return "Unknown Status";
  }
}

function FullServicesView() {
  const { services, exitService, joinService, availableServices, closeApi } = useDartStore();
  // const { chats, serverStatus } = useChatStore();
  if (!(services instanceof Map)) {
    // this is pretty dumb
    // but if i dont do it, everything explodes :)
    return <Spinner />
  }
  if (!(availableServices instanceof Map)) {
    // this is pretty dumb
    // but if i dont do it, everything explodes :)
    return <Spinner />
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
      <div>
        <div
          style={{
            fontWeight: "bold",
          }}
        >
          available services:
        </div>
        <div>
        {Array.from(availableServices.entries()).map(([serverNode, aServices]) => (
          <div
            key={serverNode}
          >
            {/* <div
              style={{
                display:"inline-block",
                marginRight: "0.8rem",
              }}
            >
              server: {serverNode}
            </div> */}
            <div
              style={{
                display:"inline-block"
              }}
            >
            {aServices.map((service) => (
                <div
                  key={serverNode+":"+service.id}
                  style={{
                    display:"inline-block"
                  }}
                >

                  {serverNode+":"+service.id}{" "}
                  {services.has(serverNode+":"+service.id) ? "connected" : 
                    <button
                      onClick={() => {
                          joinService(service);
                        }
                      }
                    >
                      connect
                    </button>
                  }
                </div>
              ))}

            </div>
          </div>

        ))}
        </div>
      </div>
      <div
        style={{
          fontWeight: "bold",
        }}
      >
        connected services:
      </div>

      {Array.from(services.entries()).map(([serviceId, service]) => (
        <div key={serviceId}
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "0.8rem",
            border: "1px solid #ffffff55",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "0.8rem",
              alignItems: "center",
              alignContent: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontStyle: "italic",
              }}
            >
              {serviceId}
            </div>
                {renderConnectionStatus(service.connectionStatus)}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "0.8rem",
            }}
          >
            <div>Subscribers:</div>
            {service.metadata.subscribers.map((subscriber, i) => (
              <div key={i}>
                {subscriber}
              </div>
            ))}
            </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "0.8rem",
            }}
          >
            <div>User Presence:</div>
            {Object.entries(service.metadata.user_presence).map(([key, presence]) => (
                <div key={key}>
                    <div>{key}</div>
                    <div>
                      {formatTimeStamp(presence.time*1000)}
                    </div>
                </div>
            ))}
          </div>
          <div>
            <button
              onClick={() => {
                exitService(service.serviceId);
              }}
              >
                disconnect
              </button>
          </div>
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


export default FullServicesView;

function formatTimeStamp(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString();
}
