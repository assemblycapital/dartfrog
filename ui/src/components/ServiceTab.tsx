import DisplayUserActivity from "./DisplayUserActivity";
import useChatStore from "../store/chat";
import ChatBox from "./ChatBox";
import ChatHeader from "./ChatHeader";
import { Service, ServiceConnectionStatusType, ServiceId, makeServiceId } from "../dartclientlib";
import ChatInput from "./ChatInput";
import useDartStore from "../store/dart";
import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import { stringifyServiceConnectionStatus } from "./FullServicesView";

interface ServiceTabProps {
  serviceId: ServiceId;
}

const ServiceTab: React.FC<ServiceTabProps> = ({ serviceId }) => {
  const { services } = useDartStore();
  const [service, setService] = useState<Service | null>(null);
  const { chats } = useChatStore();

  useEffect(() => {
    const gotService = services.get(serviceId);
    if (gotService) {
      setService(gotService);
    } else {
      setService(null);
    }
  }, [services, serviceId]);

  return (
    <div
      style={{
        minHeight: "400px",
        padding: "4px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.3rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            color: "#ffffff55",
            fontSize: "0.8rem",
            gap: "0.8rem",
          }}
        >
          <div>{serviceId}</div>
        </div>
        {!service ? (
          <Spinner />
        ) : (
          <div>
            {!(service.connectionStatus.status === ServiceConnectionStatusType.Connected) ? (
              <div>
                connecting...
                {stringifyServiceConnectionStatus(service.connectionStatus.status)}
              </div>
            ) : (
              <div>
                <ChatHeader />
                <ChatBox chats={chats} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceTab;
