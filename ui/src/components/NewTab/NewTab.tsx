import DisplayUserActivity from "../DisplayUserActivity";
import { useCallback, useEffect, useState } from "react";
import Spinner from "../Spinner";
import useDartStore from "../../store/dart";
import { AvailableServices, ParsedServiceId, Presence, Service, ServiceConnectionStatus, ServiceConnectionStatusType, ServiceId, makeServiceId } from "@dartfrog/puddle";
import './NewTab.css'
import { createSecretKey } from "crypto";
import CreateService from "./CreateService";
import ServiceList from "./ServiceList";

export const validateServiceName = (value) => {
  if (value==='') return true;
  const regex = /^[a-z0-9]+(?:[-.][a-z0-9]+)*$/;
  return regex.test(value);
};

const parseServiceLink = (value) => {
  const [protocol, the_rest] = value.split('://');
  if (protocol !== 'df') return { serviceName: '', hostNode: '', isValid: false };

  const dots = the_rest.split('.').reverse();
  const tld = dots[0];
  const hostNode = dots[1] + '.' + tld;
  const serviceName = the_rest.slice(0, -(hostNode.length + 1));

  return { serviceName, hostNode, isValid: validateServiceName(serviceName) };
};

export const validateServiceLink = (value) => {
  if (value === '') return true;
  const { serviceName, hostNode, isValid } = parseServiceLink(value);
  console.log('serviceName', serviceName);
  console.log('hostNode', hostNode);  // TODO validate hostnode

  return isValid;
};

interface NewTabProps {
  setTabService: (serviceId: ServiceId) => void;
}

const NewTab: React.FC<NewTabProps> = ({ setTabService }) => {
  const [inputJoinServiceName, setInputJoinServiceName] = useState('');
  const [isJoinServiceNameInputValid, setIsJoinServiceNameInputValid] = useState(true);
  const [inputJoinServiceHostNode, setInputJoinServiceHostNode] = useState('');
  const [inputJoinServiceLink, setInputJoinServiceLink] = useState(''); // Added state
  const [isJoinServiceLinkInputValid, setIsJoinServiceLinkInputValid] = useState(true); // Added state

  const handleJoinServiceNameInputChange = (e) => {
    const value = e.target.value;
    setInputJoinServiceName(value);
    setIsJoinServiceNameInputValid(validateServiceName(value));
  };

  const handleJoinServiceLinkInputChange = (e) => { // Added function
    const value = e.target.value;
    setInputJoinServiceLink(value);
    setIsJoinServiceLinkInputValid(validateServiceLink(value));
  };

  const handleInputJoinClick = useCallback(() => {
    if (isJoinServiceNameInputValid) {
      if (inputJoinServiceHostNode === '') return;

      if (inputJoinServiceName === '') return;
      setTabService(makeServiceId(inputJoinServiceHostNode, inputJoinServiceName));
    }
  }, [inputJoinServiceName, inputJoinServiceHostNode]);

  const handleLinkInputJoinClick = useCallback(() => { // Added function
    if (isJoinServiceLinkInputValid) {
      if (inputJoinServiceLink === '') return;
      const { serviceName, hostNode, isValid } = parseServiceLink(inputJoinServiceLink);
      if (!isValid) return;

      setTabService(makeServiceId(hostNode, serviceName));
    }
  }, [inputJoinServiceLink]);

  return (
    <div
      style={{
        height: "100%",
        maxHeight: "100%",
        boxSizing: "border-box",
        fontSize: "0.8rem",
        display: "flex",
        flexDirection: "column",
        padding: "1rem 0.4rem",
        gap: "1rem",
      }}
    >

      <ServiceList
        setTabService={setTabService}
      />
      <CreateService setTabService={setTabService}/>

      <div
        style={{
          // flex: 1,
        }}
      >
        <div
          style={{
            cursor: "default",
            userSelect: "none",
            marginBottom: '0.8rem',
          }}
        >
          join service by id:
        </div>
        <div
          style={{
            display: "flex",
            // alignItems: "center",
            // gap: "0.5rem",
          }}
        >
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
      <div
          style={{
            display: "flex",
          }}
        >
          <input type="text" placeholder="df://service.node.os" 
            value={inputJoinServiceLink}
            onChange={handleJoinServiceLinkInputChange}
            className={`${isJoinServiceLinkInputValid ? '' : 'invalid'}`}
          />
          <button
            style={{
              cursor: "pointer",
            }}
            onClick={() => {
              handleLinkInputJoinClick();
            }}
          >
            join
          </button>
      </div>

    </div>
  )
}

export default NewTab;
