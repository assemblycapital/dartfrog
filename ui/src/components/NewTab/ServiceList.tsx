import React from 'react';
import useDartStore from '../../store/dart';
import Spinner from '../Spinner';
// import { Presence, ServiceAccess } from '@dartfrog/puddle/index';
import { useNavigate } from 'react-router-dom';

const ServiceList = ({ }) => {
  // const { requestAllServiceList, requestServiceList, availableServices, deleteService} = useDartStore();
  const navigate = useNavigate();

  // if (!(availableServices instanceof Map)) {
  //   // this is pretty dumb
  //   // but if i dont do it, everything explodes :)
  //   return <Spinner />
  // }

  // Flatten the Map of Maps structure into an array of objects, excluding services with visibility "hidden"
  // const flattenedServices = Array.from(availableServices.entries()).flatMap(([node, services]) =>
  //   Array.from(services.entries())
  //     .filter(([_, serviceDetails]) => serviceDetails.visibility !== "Hidden")
  //     .map(([serviceId, serviceDetails]) => ({
  //       node,
  //       serviceId,
  //       serviceDetails
  //     }))
  // );

  // Sort the flattened array by the number of subscribers, and for those with zero subscribers, sort by recency
  // const sortedServices = flattenedServices.sort((a, b) => {
  //   const subDiff = b.serviceDetails.subscribers.length - a.serviceDetails.subscribers.length;
  //   if (subDiff !== 0) return subDiff;
  //   const aMaxTime = Object.values(a.serviceDetails.user_presence).reduce((max, p) => {
  //     return Math.max(max, p.time);
  //   }, 0);
  //   const bMaxTime = Object.values(b.serviceDetails.user_presence).reduce((max, p) => {
  //     return Math.max(max, p.time);
  //   }, 0);
  //   return bMaxTime - aMaxTime;
  // });
  const knownPlugins = {
    "chat:dartfrog:herobrine.os": "chat",
    "piano:dartfrog:herobrine.os": "piano",
    "page:dartfrog:herobrine.os": "page",
    "chess:dartfrog:herobrine.os": "chess",
  }
  function getPluginText(plugin: string) {
    let known = knownPlugins[plugin];
    if (!(known)) {
      return plugin
    }
    return known
    // let asNames = plugin.map((plugin) => knownPlugins[plugin] || plugin);
    // // if it contains nulls, then it's not a known plugin
    // if (asNames.includes(null)) {
    //   return "custom"
    // }
    // // filter out "chat"
    // return asNames.filter((name) => name !== "chat").join(', ');
  }

  // function getRecencyText(presence: { [key: string]: Presence }, subscribers) {
  //   const now = new Date();
  //   const time = Object.values(presence).reduce((max, p) => {
  //     return Math.max(max, p.time);
  //   }, 0);
  //   const diff = now.getTime() - time*1000;

  //   // if less than 5min, say now
  //   // if less than 1h, say x min ago
  //   // if less than 1d, say x hr ago
  //   // else say x days ago
  //   if (subscribers.length > 0) {
  //     return `now`;
  //   }
  //   if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  //   if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
  //   // if its older than 2yrs, say its old
  //   if (diff > 7307200000) return `old`;
  //   return `${Math.floor(diff / 86400000)} days ago`;
  // }
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
            // requestAllServiceList();
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
        {/* {sortedServices.map(({ node, serviceId, serviceDetails }) => (
          <div
            key={`${node}-${serviceId}`}
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
              { (serviceDetails.access === "Public") ||
               (serviceDetails.access === "HostOnly" && node === window.our?.node) ||
               (serviceDetails.access === "Whitelist" && (node === window.our?.node || serviceDetails.whitelist.includes(window.our?.node))) ? (
                <div
                  style={{
                    cursor: "pointer",
                    flex: "1",
                    textAlign: "center",
                  }}
                  className="join-button"
                  onClick={() => {
                    navigate(`/join/${serviceId}`);
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
              {node === window.our?.node && (
                <div
                  style={{
                    cursor: "pointer",
                    flex: "1",
                    textAlign: "center",
                  }}
                  className="delete-button"
                  onClick={() => {
                    deleteService(serviceId);
                    requestServiceList(window.our?.node);
                  }}
                >
                  delete
                </div>
              )}
            </div>

            <div style={{
                flex: "3",
                padding: "0.5rem 0",
              }}
              >
              {serviceId}</div>
            <div style={{ flex: "4" }}>
              {getPluginText(serviceDetails.plugin)}
            </div>
            <div style={{ flex: "1" }}>
              {getRecencyText(serviceDetails.user_presence, serviceDetails.subscribers)}
            </div>
            <div style={{ flex: "1" }}>
              {serviceDetails.subscribers.length} online
            </div>
          </div>
        ))} */}
      </div>
    </div>
  );
};

export default ServiceList;