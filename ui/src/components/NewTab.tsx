import DisplayUserActivity from "./DisplayUserActivity";
import useChatStore from "../store/chat_old";

import ChatBox from "./ChatBox";
import ChatHeader from "./ChatHeader";
import { ConnectionStatusType, ServerStatus } from "../types/types";
import { useCallback, useEffect, useState } from "react";
import Spinner from "./Spinner";
import useDartStore from "../store/dart";
import { Service, ServiceConnectionStatus, ServiceConnectionStatusType, ServiceId, makeServiceId } from "../dartclientlib";

interface NewTabProps {
  setTabService: (serviceId: ServiceId) => void;
}

const NewTab: React.FC<NewTabProps> = ({ setTabService }) => {
  const { availableServices, joinService } = useDartStore();
  // 

  if (!(availableServices instanceof Map)) {
    // this is pretty dumb
    // but if i dont do it, everything explodes :)
    return <Spinner />
  }
  // 
  const [inputJoinServiceName, setInputJoinServiceName] = useState('');
  const [inputJoinServiceHostNode, setInputJoinServiceHostNode] = useState('');

  const handleInputJoinClick = useCallback(() => {
    setTabService(makeServiceId(inputJoinServiceHostNode, inputJoinServiceName));
  }, [inputJoinServiceName, inputJoinServiceHostNode]);

  return (
    <div
      style={{
        height: "400px",
        padding: "4px",
        color: "#ffffffcc",
        fontSize: "0.8rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.8rem",
      }}
    >
      <div>
        <div
          style={{
            marginBottom: "0.8rem",
            cursor: "default",
          }}
        >
          create a new service:
        </div>
        <input type="text" placeholder="service-name" />
        <button
          style={{
            cursor: "pointer",
          }}
          onClick={() => {
            alert("coming soon");
          }}
        >
          create
        </button>
      </div>
      <div>
        <div
          style={{
            marginBottom: "0.8rem",
            cursor: "default",
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
            <div key={serverNode}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
              }}
            >
              {aServices.map((service) => (
                  <div
                    key={makeServiceId(serverNode, service.id)}
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
                    <span
                      style={{
                        cursor: "default",
                      }}
                    >
                      {makeServiceId(serverNode, service.id)}
                      </span>
                  </div>
                ))}
            </div>
          ))}
          </div>
        </div>
        <div>
        <div
          style={{
            marginBottom: "0.8rem",
            cursor: "default",
          }}
        >
         join service by id:
        </div>
        <input type="text" placeholder="service-name" 
          value={inputJoinServiceName}
          onChange={(e) => setInputJoinServiceName(e.target.value)}
        />
        <input type="text" placeholder="template.os"
          value={inputJoinServiceHostNode}
          onChange={(e) => setInputJoinServiceHostNode(e.target.value)}
          />
        <button
          style={{
            cursor: "pointer",
          }}
          onClick={() => {
            // alert("coming soon");
            handleInputJoinClick();
          }}
        >
          join
        </button>
      </div>
    </div>
  );
}


export default NewTab;
