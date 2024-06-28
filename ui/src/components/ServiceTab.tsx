import DisplayUserActivity from "./DisplayUserActivity";
import { Service, ServiceConnectionStatusType, ServiceId, ServiceMetadata, makeServiceId, stringifyServiceConnectionStatus } from "@dartfrog/puddle";
import useDartStore from "../store/dart";
import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import ServiceConnectedDisplay from "./ServiceConnectedDisplay";

interface ServiceTabProps {
  serviceId: ServiceId;
  addTab: (serviceId: ServiceId | null) => void;
}

const ServiceTab: React.FC<ServiceTabProps> = ({ serviceId, addTab }) => {
  const {services} = useDartStore();
  const service = services.get(serviceId);

  return (
    <div
      style={{
        height: "100%",
        maxHeight: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.3rem",
          height: "100%",
          padding: "4px",
          boxSizing: "border-box",
        }}
      >
        {!service ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "2rem",
              height: "100%",
            }}
          >
              
              loading...
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
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "2rem",
                        height: "100%",
                      }}
                    >
                      connecting...
                      <Spinner />
                    </div>
                  ) : (
                  <>
                  {(service.connectionStatus.status === ServiceConnectionStatusType.Kicked) ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                      }}
                    >
                      You were kicked from {serviceId}
                    </div>
                  ) : (
                    <>
                    {(service.connectionStatus.status===ServiceConnectionStatusType.ServiceDoesNotExist) ? (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "100%",
                        }}
                      >
                        {serviceId} does not exist...
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "100%",
                        }}
                      >
                        Disconnected
                      </div>
                      )}
                      </>
                    )}
                  </>
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
