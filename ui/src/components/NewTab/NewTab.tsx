import DisplayUserActivity from "../DisplayUserActivity";
import { useCallback, useEffect, useState } from "react";
import Spinner from "../Spinner";
import useDartStore from "../../store/dart";
import { AvailableServices, ParsedServiceId, Presence, Service, ServiceConnectionStatus, ServiceConnectionStatusType, ServiceId, makeServiceId } from "@dartfrog/puddle";
import './NewTab.css'
import { createSecretKey } from "crypto";
import CreateService from "./CreateService";

export const validateServiceName = (value) => {
  if (value==='') return true;
  const regex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return regex.test(value);
};

interface NewTabProps {
  setTabService: (serviceId: ServiceId) => void;
}

const NewTab: React.FC<NewTabProps> = ({ setTabService }) => {
  const { requestAllServiceList, requestServiceList, availableServices, deleteService} = useDartStore();
  // 
  const [inputJoinServiceName, setInputJoinServiceName] = useState('');
  const [isJoinServiceNameInputValid, setIsJoinServiceNameInputValid] = useState(true);
  const [inputJoinServiceHostNode, setInputJoinServiceHostNode] = useState('');

  const handleJoinServiceNameInputChange= (e) => {
    const value = e.target.value;
    setInputJoinServiceName(value);
    setIsJoinServiceNameInputValid(validateServiceName(value));
  };

  const handleInputJoinClick = useCallback(() => {
    if (isJoinServiceNameInputValid) {
      if (inputJoinServiceHostNode === '') return;

      if (inputJoinServiceName === '') return;
      setTabService(makeServiceId(inputJoinServiceHostNode, inputJoinServiceName));
    }
  }, [inputJoinServiceName, inputJoinServiceHostNode]);

  if (!(availableServices instanceof Map)) {
    // this is pretty dumb
    // but if i dont do it, everything explodes :)
    return <Spinner />
  }
  useEffect(() => {
    console.log("availableServices", availableServices);
  }, [availableServices]);

  // Flatten the Map of Maps structure into an array of objects
  const flattenedServices = Array.from(availableServices.entries()).flatMap(([node, services]) =>
    Array.from(services.entries()).map(([serviceId, serviceDetails]) => ({
      node,
      serviceId,
      serviceDetails
    }))
  );

  // Sort the flattened array by the number of subscribers
  const sortedServices = flattenedServices.sort((a, b) => b.serviceDetails.subscribers.length - a.serviceDetails.subscribers.length);

  const knownPlugins = {
    "chat:dartfrog:herobrine.os": "chat",
    "piano:dartfrog:herobrine.os": "piano",
    "page:dartfrog:herobrine.os": "page",
    "chess:dartfrog:herobrine.os": "chess",
  }
  function getPluginText(plugins: string[]) {
    let asNames = plugins.map((plugin) => knownPlugins[plugin] || plugin);
    // if it contains nulls, then it's not a known plugin
    if (asNames.includes(null)) {
      return "custom"
    }
    // filter out "chat"
    return asNames.filter((name) => name !== "chat").join(', ');
  }

  function getRecencyText(presence: { [key: string]: Presence }, subscribers) {
    const now = new Date();
    const time = Object.values(presence).reduce((max, p) => {
      return Math.max(max, p.time);
    }, 0);
    const diff = now.getTime() - time*1000;

    // if less than 5min, say now
    // if less than 1h, say x min ago
    // if less than 1d, say x hr ago
    // else say x days ago
    if (subscribers.length > 0) {
      return `now`;
    }
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
    // if its older than 2yrs, say its new
    if (diff > 7307200000) return `new`;
    return `${Math.floor(diff / 86400000)} days ago`;
  }

  return (
    <div
      style={{
        minHeight: "400px",
        padding: "4px",
        color: "#ffffffcc",
        fontSize: "0.8rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        margin: "0.8rem 0rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
        }}
      >
        <div
          style={{
            display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          padding: "0.5rem 0",
          borderBottom: "1px solid #494949"
        }}>
          <div style={{ flex: "2",  }}></div>
          <div style={{ flex: "3",  }}>Service</div>
          <div style={{ flex: "4", }}>Apps</div>
          <div style={{ flex: "1",  }}></div>
          <div style={{ flex: "1",  }}></div>
        </div>

        <div
          style={{
          overflowY: "scroll",
          maxHeight: "250px",

          }}
        >

        {sortedServices.map(({ node, serviceId, serviceDetails }) => (
          <div key={`${node}-${serviceId}`}
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
              <div
                style={{
                  cursor: "pointer",
                  flex: "1",
                  textAlign: "center",
                }}
                className="join-button"
                onClick={() => {
                  setTabService(serviceId);
                }}
              >
                join
              </div>
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

            <div style={{ flex: "3" }}>{serviceId}</div>
            <div style={{ flex: "4" }}>
              {getPluginText(serviceDetails.plugins)}
            </div>
            <div style={{ flex: "1" }}>
              {getRecencyText(serviceDetails.user_presence, serviceDetails.subscribers)}
            </div>
            <div style={{ flex: "1" }}>{serviceDetails.subscribers.length}{' online'}</div>
          </div>
        ))}
        </div>
      </div>

      <CreateService />
      <div>
        <div
          style={{
            marginBottom: "0.8rem",
            cursor: "default",
            userSelect: "none",
          }}
        >
          join service by id:
        </div>
        <input type="text" placeholder="service-name" 
          value={inputJoinServiceName}
          onChange={handleJoinServiceNameInputChange}
          className={`${isJoinServiceNameInputValid ? '' : 'invalid'}`}
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
  )
  // return (
  //   <div
  //     style={{
  //       minHeight: "400px",
  //       padding: "4px",
  //       color: "#ffffffcc",
  //       fontSize: "0.8rem",
  //       display: "flex",
  //       flexDirection: "column",
  //       gap: "0.8rem",
  //     }}
  //   >
  //       <CreateService />
  //       <div
  //         style={{
  //           display: "flex",
  //           flexDirection: "column",
  //           gap: "0.8rem",
  //         }}
  //         >
  //         <div
  //           style={{
  //             cursor: "default",
  //             userSelect: "none",

  //           }}
  //         >
  //           my services:
  //         </div>
  //         {myServices.map((service) => (
  //             <div
  //               key={makeServiceId(service.node, service.id)}
  //               style={{
  //                 display: "flex",
  //                 flexDirection: "row",
  //                 gap: "0.4rem",
  //               }}
  //             >
  //               <button
  //                 style={{
  //                   cursor: "pointer",
  //                 }}
  //                 onClick={() => {
  //                   setTabService(makeServiceId(service.node, service.id));
  //                 }}
  //               >
  //                 join
  //               </button>
  //               <button
  //                 style={{
  //                   cursor: "pointer",
  //                   color: "#ff666699"
  //                 }}
  //                 onClick={() => {
  //                   deleteService(makeServiceId(service.node, service.id));
  //                   requestServiceList(window.our?.node);
  //                 }}
  //               >
  //                 delete
  //               </button>
  //               <span
  //                 style={{
  //                   cursor: "default",
  //                   // userSelect: "none",
  //                   alignContent: "center",
  //                 }}
  //               >
  //                 {makeServiceId(service.node, service.id)}
  //                 </span>
  //             </div>
  //           ))}
  //     </div>
  //     <div>
  //       <div
  //         style={{
  //           marginBottom: "0.8rem",
  //           cursor: "default",
  //           userSelect: "none",
  //         }}
  //       >
  //         known services:
  //       </div>
  //       <div
  //         style={{
  //           display: "flex",
  //           flexDirection: "column",
  //           gap: "0.8rem",
  //         }}
  //       >
  //         {otherServices.map((service) => (
  //             <div
  //               key={makeServiceId(service.node, service.id)}
  //               style={{
  //                 display: "flex",
  //                 flexDirection: "row",
  //                 gap: "0.4rem",
  //               }}
  //             >
  //               <button
  //                 style={{
  //                   cursor: "pointer",
  //                 }}
  //                 onClick={() => {
  //                   setTabService(makeServiceId(service.node, service.id));
  //                 }}
  //               >
  //                 join
  //               </button>
  //               <span
  //                 style={{
  //                   cursor: "default",
  //                   alignContent: "center",
  //                   // userSelect: "none",
  //                 }}
  //               >
  //                 {makeServiceId(service.node, service.id)}
  //                 </span>
  //             </div>
  //           ))}
  //         </div>
  //       </div>
  //       <div>
  //       <div
  //         style={{
  //           marginBottom: "0.8rem",
  //           cursor: "default",
  //           userSelect: "none",
  //         }}
  //       >
  //        join service by id:
  //       </div>
  //       <input type="text" placeholder="service-name" 
  //         value={inputJoinServiceName}
  //         onChange={handleJoinServiceNameInputChange}
  //         className={`${isJoinServiceNameInputValid ? '' : 'invalid'}`}
  //       />
  //       <input type="text" placeholder="template.os"
  //         value={inputJoinServiceHostNode}
  //         onChange={(e) => setInputJoinServiceHostNode(e.target.value)}
  //         />
  //       <button
  //         style={{
  //           cursor: "pointer",
  //         }}
  //         onClick={() => {
  //           // alert("coming soon");
  //           handleInputJoinClick();
  //         }}
  //       >
  //         join
  //       </button>
  //     </div>
  //   </div>
  // );
}

export default NewTab;
