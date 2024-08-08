import DisplayUserActivity from "@dartfrog/puddle/components/DisplayUserActivity";
import { useCallback, useEffect, useState } from "react";
import Spinner from "@dartfrog/puddle/components/Spinner";
import useDartStore from "../../store/dart";
import {ServiceConnectionStatus, ServiceConnectionStatusType, dfLinkRegex, getAllServicesFromPeerMap, getUniqueServices, } from "@dartfrog/puddle";
import './Services.css'
import { createSecretKey } from "crypto";
import CreateService from "./CreateService";
import ServiceList from "./ServiceList";
import { useNavigate } from 'react-router-dom';
import CurrentPageHeader from "../CurrentPageHeader";

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
  const isValid = dfLinkRegex.test(value);
  return isValid;
};

interface ServicesProps {
}

const Services: React.FC<ServicesProps> = ({ }) => {
  const [inputJoinServiceName, setInputJoinServiceName] = useState('');
  const [isJoinServiceNameInputValid, setIsJoinServiceNameInputValid] = useState(true);
  const [inputJoinServiceHostNode, setInputJoinServiceHostNode] = useState('');
  const [inputJoinServiceLink, setInputJoinServiceLink] = useState('');
  const [isJoinServiceLinkInputValid, setIsJoinServiceLinkInputValid] = useState(true);

  const navigate = useNavigate();

  const {localServices, peerMap, setCurrentPage} = useDartStore();

  const handleJoinServiceNameInputChange = (e) => {
    const value = e.target.value;
    setInputJoinServiceName(value);
    setIsJoinServiceNameInputValid(validateServiceName(value));
  };

  const handleJoinServiceLinkInputChange = (e) => {
    const value = e.target.value;
    setInputJoinServiceLink(value);
    setIsJoinServiceLinkInputValid(validateServiceLink(value));
  };

  const handleInputJoinClick = useCallback(() => {
    if (isJoinServiceNameInputValid) {
      if (inputJoinServiceHostNode === '') return;

      if (inputJoinServiceName === '') return;
      navigate(`/join/${inputJoinServiceName}.${inputJoinServiceHostNode}`);
    }
  }, [inputJoinServiceName, inputJoinServiceHostNode]);

  const handleLinkInputJoinClick = useCallback(() => {
    if (isJoinServiceLinkInputValid) {
      const serviceId = inputJoinServiceLink.slice(5,)
      navigate(`/join/${serviceId}`);

    }
  }, [inputJoinServiceLink]);

  const allServices = getUniqueServices([
    ...localServices,
    ...getAllServicesFromPeerMap(peerMap).filter(service => service.id.hostNode() !== window.our?.node)
  ]);

  useEffect(()=>{
    setCurrentPage('services')
  }, [])

  return (
    <div
      style={{
        height: "100%",
        maxHeight: "100%",
        boxSizing: "border-box",
        fontSize: "0.8rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        marginTop:"1rem",
        overflowY:"auto",
      }}
    >
      <ServiceList
        services={allServices}
      />

      <CreateService />

      <hr />
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
          }}
        >
          <input type="text" placeholder="df://service:node.os@app:pkg:dev.os" 
            value={inputJoinServiceLink}
            onChange={handleJoinServiceLinkInputChange}
            className={`${isJoinServiceLinkInputValid ? '' : 'invalid'}`}
            style={{
              flexGrow:"1",
            }}
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

    </div>
  )
}

export default Services;