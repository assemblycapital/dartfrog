import DisplayUserActivity from "./DisplayUserActivity";
import { Service, ServiceConnectionStatusType, ServiceId, ServiceMetadata, makeServiceId, stringifyServiceConnectionStatus } from "@dartfrog/puddle";
import useDartStore from "../store/dart";
import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import ServiceConnectedDisplay from "./ServiceConnectedDisplay";

interface ServiceTabProps {
  serviceId: ServiceId;
  services: Map<ServiceId, Service>;
  addTab: (serviceId: ServiceId | null) => void;
}

const ServiceTab: React.FC<ServiceTabProps> = ({ serviceId, services, addTab }) => {
  const [service, setService] = useState<Service | null>(null);

  useEffect(() => {
    if (!(services instanceof Map)) return;
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
        // minHeight: "400px",
        height: "100%",
        padding: "4px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.3rem",
          height: "100%",
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
          <>
            {!(service.connectionStatus.status === ServiceConnectionStatusType.Connected) ? (
              <>
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
                  </>
                  ) : (
                    <ServiceConnectedDisplay serviceId={serviceId} service={service} addTab={addTab} />
                )}
              </>
          )}
      </div>
    </div>
  );
};

export default ServiceTab;
