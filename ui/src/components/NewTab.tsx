import DisplayUserActivity from "./DisplayUserActivity";
import useChatStore from "../store/chat_old";

import ChatBox from "./ChatBox";
import ChatHeader from "./ChatHeader";
import { ConnectionStatusType, ServerStatus } from "../types/types";
import { useCallback, useEffect, useState } from "react";
import Spinner from "./Spinner";
import useDartStore from "../store/dart";
import { AvailableServices, ParsedServiceId, Service, ServiceConnectionStatus, ServiceConnectionStatusType, ServiceId, makeServiceId } from "../dartclientlib";
import './NewTab.css'
import { createSecretKey } from "crypto";

interface NewTabProps {
  setTabService: (serviceId: ServiceId) => void;
}

const NewTab: React.FC<NewTabProps> = ({ setTabService }) => {
  const { requestServiceList, availableServices, joinService, createService} = useDartStore();
  // 

  const [ myServices, setMyServices ] = useState<ParsedServiceId[]>([]);
  const [ otherServices, setOtherServices ] = useState<ParsedServiceId[]>([]);
  useEffect(() => { 
    let me = window.our?.node;
    let mine = []
    let other = []
    for (let [serverNode, aServices] of availableServices) {
      if (serverNode === me) {
        for (let a of aServices) {
          mine.push(a)
        }
      } else {
        for (let a of aServices) {
          other.push(a)
        }
      }
    }
    setMyServices(mine);
    setOtherServices(other);
  }, [availableServices]);

  if (!(availableServices instanceof Map)) {
    // this is pretty dumb
    // but if i dont do it, everything explodes :)
    return <Spinner />
  }
  // 
  const [inputJoinServiceName, setInputJoinServiceName] = useState('');
  const [inputJoinServiceHostNode, setInputJoinServiceHostNode] = useState('');

  const [inputCreateServiceName, setInputCreateServiceName] = useState('');
  const [isCreateInputValid, setIsCreateInputValid] = useState(true);

  const validateCreateInput = (value) => {
    if (value==='') return true;
    const regex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return regex.test(value);
  };

  const handleCreateInputChange = (e) => {
    const value = e.target.value;
    setInputCreateServiceName(value);
    setIsCreateInputValid(validateCreateInput(value));
  };
  const handleInputCreateClick = useCallback(() => {
    if (isCreateInputValid) {
      if (inputCreateServiceName ==='') return;
      // console.log('Service name is valid:', inputCreateServiceName);
      // Proceed with the creation logic
      let serviceId = inputCreateServiceName+"."+window.our?.node
      // console.log("create service", serviceId);
      createService(serviceId);
      requestServiceList(window.our?.node);
    } else {
      // console.log('Invalid service name.');
    }
    // setTabService(makeServiceId(inputJoinServiceHostNode, inputJoinServiceName));
  }, [inputCreateServiceName]);

  const handleInputJoinClick = useCallback(() => {
    setTabService(makeServiceId(inputJoinServiceHostNode, inputJoinServiceName));
  }, [inputJoinServiceName, inputJoinServiceHostNode]);

  return (
    <div
      style={{
        minHeight: "400px",
        padding: "4px",
        color: "#ffffffcc",
        fontSize: "0.8rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.8rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.8rem",
        }}
      >
        <div
          style={{
            cursor: "default",
          }}
        >
          create a new service:
        </div>
        <div>
          <input
          type="text"
          placeholder="service-name"
          value={inputCreateServiceName}
          onChange={handleCreateInputChange}
          className={`${isCreateInputValid ? '' : 'invalid'}`}
          />
          <button
            style={{
              cursor: 'pointer',
            }}
            onClick={handleInputCreateClick}
          >
            create
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.8rem",
          }}
          >
          {myServices.map((service) => (
              <div
                key={makeServiceId(service.node, service.id)}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "0.4rem",
                }}
              >
                <button
                  style={{
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setTabService(makeServiceId(service.node, service.id));
                  }}
                >
                  join
                </button>
                <button
                  style={{
                    cursor: "pointer",
                    color: "#ff000077"
                  }}
                  onClick={() => {
                    alert("coming soon");
                  }}
                >
                  delete
                </button>
                <span
                  style={{
                    cursor: "default",
                    alignContent: "center",
                  }}
                >
                  {makeServiceId(service.node, service.id)}
                  </span>
              </div>
            ))}
            </div>
      </div>
      <div>
        <div
          style={{
            marginBottom: "0.8rem",
            cursor: "default",
          }}
        >
          known services:
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.8rem",
          }}
        >
          {otherServices.map((service) => (
              <div
                key={makeServiceId(service.node, service.id)}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "0.4rem",
                }}
              >
                <button
                  style={{
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setTabService(makeServiceId(service.node, service.id));
                  }}
                >
                  join
                </button>
                <span
                  style={{
                    cursor: "default",
                    alignContent: "center",
                  }}
                >
                  {makeServiceId(service.node, service.id)}
                  </span>
              </div>
            ))}
          </div>
        </div>
        <div>
        <div
          style={{
            marginBottom: "0.8rem",
            cursor: "default",
          }}
        >
         join service by id:
        </div>
        <input type="text" placeholder="service-name" 
          value={inputJoinServiceName}
          onChange={(e) => setInputJoinServiceName(e.target.value)}
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
  );
}


export default NewTab;
