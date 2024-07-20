import React from 'react';
import useDartStore from '../../store/dart';
import Spinner from '../Spinner';
// import { Presence, ServiceAccess } from '@dartfrog/puddle/index';
import { useNavigate } from 'react-router-dom';
import { Service, ServiceID, ServiceVisibility, getAllServicesFromPeerMap, getServiceRecencyText, sortServices } from '@dartfrog/puddle/index';

const ServiceList = ({services }) => {
  const { localServices, deleteService, requestLocalServiceList, peerMap, localFwdAllPeerRequests } = useDartStore();
  const navigate = useNavigate();

  // const allServices = [...localServices, ...getAllServicesFromPeerMap(peerMap)];
  // const uniqueServices = Array.from(new Set(allServices.map(service => service.id.toString())))
  //   .map(id => allServices.find(service => service.id.toString() === id));

  // // Sort the flattened array by the number of subscribers, and for those with zero subscribers, sort by recency
  const sortedServices = sortServices(services);

  const knownProcesses = {
    "chat:dartfrog:herobrine.os": "chat",
    "piano:dartfrog:herobrine.os": "piano",
    "page:dartfrog:herobrine.os": "page",
    "chess:dartfrog:herobrine.os": "chess",
  }
  function getProcessText(address: string) {
    let [node, process] = address.split("@")
    let known = knownProcesses[process];
    if (!(known)) {
      return process
    }
    return known
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-evenly",
        boxSizing: "border-box",
      }}
    >
      <div
        className="service-list-header"
        style={{
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            cursor: "pointer",
          }}
          className="service-list-header-refresh"
          onClick={() => {
            requestLocalServiceList();
          }}
        >
          <span
            style={{
              fontSize: "1.2rem",
              marginBottom: "0.2rem",
              padding: "0 0.5rem",
            }}
          >
            ⟳
          </span>
        </div>
        <span>service list:</span>
      </div>

      <div
        style={{
          overflowY: "auto",
          maxHeight: "250px",
        }}
      >
        {sortedServices.map((service) => {
          let hostNode = service.id.address.split("@")[0];
          return (
            <div
              key={`${service.id.toString()}`}
              className="service-list-item"
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  flex: "2",
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: "0.2rem",
                }}
              >
                { (service.meta.access === "Public") ||
                 (service.meta.access === "HostOnly" && hostNode === window.our?.node) ||
                 (service.meta.access === "Whitelist" && (hostNode === window.our?.node || service.meta.whitelist.includes(window.our?.node))) ? (
                  <div
                    style={{
                      cursor: "pointer",
                      flex: "1",
                      textAlign: "center",
                    }}
                    className="join-button"
                    onClick={() => {
                      navigate(`/join/${service.id.toString()}`);
                    }}
                  >
                    join
                  </div>
                ) : (
                  <div
                    style={{
                      flex: "1",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                    }}
                  >
                    private
                  </div>
                )}
                {hostNode === window.our?.node && (
                  <div
                    style={{
                      cursor: "pointer",
                      flex: "1",
                      textAlign: "center",
                    }}
                    className="delete-button"
                    onClick={() => {
                      deleteService(service.id.toString());
                      requestLocalServiceList();
                    }}
                  >
                    delete
                  </div>
                )}
              </div>

              <div style={{
                  flex: "3",
                  // padding: "0.5rem 0",
                }}
                >
                {service.id.toShortString()}</div>
              <div style={{ flex: "4" }}>
                {getProcessText(service.id.address)}
              </div>
              <div style={{ flex: "1" }}>
                {getServiceRecencyText(service)}
              </div>
              <div style={{ flex: "1" }}>
                {service.meta.subscribers.length} online
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceList;