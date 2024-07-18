import React from 'react';
import useDartStore from '../../store/dart';
import Spinner from '../Spinner';
// import { Presence, ServiceAccess } from '@dartfrog/puddle/index';
import { useNavigate } from 'react-router-dom';
import { Service, ServiceID, ServiceVisibility } from '@dartfrog/puddle/index';

const ServiceList = ({ }) => {
  const { localServices, deleteService, requestLocalServiceList } = useDartStore();
  const navigate = useNavigate();

  // Sort the flattened array by the number of subscribers, and for those with zero subscribers, sort by recency
  const sortedServices = localServices.sort((a, b) => {
    const subDiff = b.meta.subscribers.length - a.meta.subscribers.length;
    if (subDiff !== 0) return subDiff;

    const aMaxTime = a.meta.last_sent_presence ?? 0;
    const bMaxTime = b.meta.last_sent_presence ?? 0;

    return bMaxTime - aMaxTime;
  });

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

  function getRecencyText(service: Service) {
    const now = new Date();
    if (!(service.meta.last_sent_presence)) {
      return "new"
    }
    const time = service.meta.last_sent_presence
    const diff = now.getTime() - time*1000;

    // if less than 5min, say now
    // if less than 1h, say x min ago
    // if less than 1d, say x hr ago
    // else say x days ago
    if (service.meta.subscribers.length > 0) {
      return `now`;
    }
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
    // if its older than 2yrs, say its old
    if (diff > 7307200000) return `old`;
    return `${Math.floor(diff / 86400000)} days ago`;
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
                      // requestLocalServiceList(window.our?.node);
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
                {getRecencyText(service)}
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