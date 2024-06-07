import DisplayUserActivity from "./DisplayUserActivity";
import useChatStore from "../store/chat";

import ChatBox from "./ChatBox";
import ChatHeader from "./ChatHeader";
import { ConnectionStatusType, ServerStatus } from "../types/types";
import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import useDartStore from "../store/dart";
import { Service, ServiceConnectionStatus, ServiceConnectionStatusType, ServiceId } from "../dartclientlib";

interface ServiceTabProps {
  service: Service;
}

const ServiceTab: React.FC<ServiceTabProps> = ({ service }) => {
  return (
    <div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "0.8rem",
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
              {service.serviceId.node}{':'}
              {service.serviceId.id}
            </div>
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
                      {/* {formatTimeStamp(presence.time*1000)} */}
                    </div>
                </div>
            ))}
          </div>
          <div>
            <button
              onClick={() => {
                // exitService(service.serviceId);
              }}
              >
                disconnect
              </button>
          </div>
        </div>

    </div>
  );
}


export default ServiceTab;

function formatTimeStamp(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString();
}
