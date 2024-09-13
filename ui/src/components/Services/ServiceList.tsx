import React from 'react';
import useDartStore from '../../store/dart';
// import { Presence, ServiceAccess } from '@dartfrog/puddle/index';
import { useNavigate } from 'react-router-dom';
import { PublicService, Service, ServiceID, ServiceVisibility, dfLinkToRealLink, getServiceRecencyText, sortServices } from '@dartfrog/puddle';

const ServiceList = ({services }) => {
  const { localServices, deleteService, requestLocalServiceList, localFwdPeerRequest, peerMap, localFwdAllPeerRequests } = useDartStore();
  const navigate = useNavigate();

  // const allServices = [...localServices, ...getAllServicesFromPeerMap(peerMap)];
  // const uniqueServices = Array.from(new Set(allServices.map(service => service.id.toString())))
  //   .map(id => allServices.find(service => service.id.toString() === id));

  // // Sort the flattened array by the number of subscribers, and for those with zero subscribers, sort by recency
  const baseOrigin = window.origin.split(".").slice(1).join(".")
  const sortedServices = sortServices(services);

  const knownProcesses = {
    "chat:dartfrog:herobrine.os": "chat",
    "piano:dartfrog:herobrine.os": "piano",
    "page:dartfrog:herobrine.os": "page",
    "chess:dartfrog:herobrine.os": "chess",
    "radio:dartfrog:herobrine.os": "radio",
    "forum:dartfrog:herobrine.os": "forum",
    "rumors:dartfrog:herobrine.os": "rumors",
  }
  function getProcessText(address: string) {
    let [node, process] = address.split("@")
    let known = knownProcesses[process];
    if (!(known)) {
      return process
    }
    return known
  }

  function getOnlineCount(service: PublicService) {
    if (service.meta.subscribers) {
      return `${service.meta.subscribers.length} online`;
    } else if (service.meta.subscriber_count !== null && service.meta.subscriber_count !== null) {
      return `${service.meta.subscriber_count} online`;
    }
    return '';
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
                 (service.meta.access === "Whitelist" && (hostNode === window.our?.node || (service.meta.whitelist && service.meta.whitelist.includes(window.our?.node)))) ? (
                  <a
                    style={{
                      cursor: "pointer",
                      flex: "1",
                      textAlign: "center",
                    }}
                    className="join-button"
                    href={dfLinkToRealLink(`df://${service.id.toString()}`, baseOrigin)}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/join/${service.id.toString()}`);
                    }}
                  >
                    join
                  </a>
                ) : (
                  <div
                    style={{
                      flex: "1",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                      padding: "0.5rem 0",
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
                      if (window.confirm(`Are you sure you want to delete ${service.id.toString()}?`)) {
                        deleteService(service.id.toString());
                        requestLocalServiceList();
                        localFwdPeerRequest(window.our?.node);
                      }
                    }}
                  >
                    delete
                  </div>
                )}
              </div>

              <div
                style={{
                  flex: "3",
                  cursor: 'pointer',
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                onClick={()=>{
                  navigate(`/services/${service.id.toString()}`);
                }}
                >
                {service.id.toShortString()}
              </div>
              <div 
                style={{
                  flex: "4",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                >
                {getProcessText(service.id.address)}
              </div>
              <div style={{ flex: "1" }}>
                {getServiceRecencyText(service)}
              </div>
              <div style={{ flex: "1" }}>
                {getOnlineCount(service)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceList;