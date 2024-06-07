import DisplayUserActivity from "./DisplayUserActivity";
import useChatStore from "../store/chat";

import ChatBox from "./ChatBox";
import ChatHeader from "./ChatHeader";
import { ConnectionStatusType, ServerStatus } from "../types/types";
import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import useDartStore from "../store/dart";
import { Service, ServiceConnectionStatus, ServiceConnectionStatusType, ServiceId, makeServiceId } from "../dartclientlib";

interface NewTabProps {
  setTabService: (servid: ServiceId) => void;
}

const NewTab: React.FC<NewTabProps> = ({ setTabService }) => {
  const { availableServices, joinService } = useDartStore();

  if (!(availableServices instanceof Map)) {
    // this is pretty dumb
    // but if i dont do it, everything explodes :)
    return <Spinner />
  }

  return (
    <div
      style={{
        height: "400px",
        padding: "4px",
      }}
    >
      <div>
        <div
          style={{
            marginBottom: "0.8rem",
          }}
        >
          known services:
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.8rem",
          }}
        >
          {Array.from(availableServices.entries()).map(([serverNode, aServices]) => (
            <span key={serverNode}>
              {aServices.map((service) => (
                  <div
                    key={serverNode+":"+service.id}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: "0.4rem",
                    }}
                  >
                    <button
                      style={{
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setTabService(makeServiceId(serverNode, service.id));
                      }}
                    >
                      join
                    </button>
                    {serverNode+":"+service.id}{" "}
                  </div>
                ))}
            </span>
          ))}
          </div>
        </div>
    </div>
  );
}


export default NewTab;
