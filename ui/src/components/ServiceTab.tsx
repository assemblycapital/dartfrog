import DisplayUserActivity from "./DisplayUserActivity";
import ChatBox from "./ChatBox";
import ChatHeader from "./ChatHeader";
import { Service, ServiceConnectionStatusType, ServiceId, ServiceMetadata, makeServiceId } from "../dartclientlib";
import ChatInput from "./ChatInput";
import useDartStore from "../store/dart";
import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import { stringifyServiceConnectionStatus } from "./FullServicesView";
import { ChatMessageHistory } from "../types/types";
import Piano from "./Piano/Piano";
import ServiceConnectedDisplay from "./ServiceConnectedDisplay";

interface ServiceTabProps {
  serviceId: ServiceId;
  services: Map<ServiceId, Service>;
}

const ServiceTab: React.FC<ServiceTabProps> = ({ serviceId, services }) => {
  const [service, setService] = useState<Service | null>(null);

  useEffect(() => {
    const gotService = services.get(serviceId);
    if (gotService) {
      setService({ ...gotService });
      // console.log("service updated in servicetab")
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
        {!service ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "400px",
            }}
          >
            <Spinner />
          </div>
        ) : (
          <div>
            {!(service.connectionStatus.status === ServiceConnectionStatusType.Connected) ? (
              <div>
              {(service.connectionStatus.status === ServiceConnectionStatusType.Connecting) ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "400px",
                      }}
                    >
                      <Spinner />
                    </div>
                  ) : (
                  <div>
                    {stringifyServiceConnectionStatus(service.connectionStatus.status)}
                  </div>
                  )}
                  </div>
                  ) : (
                    <ServiceConnectedDisplay serviceId={serviceId} service={service} />
                )}
              </div>
          )}
      </div>
    </div>
  );
};

export default ServiceTab;
