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
  const regex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return regex.test(value);
};

interface NewTabProps {
  setTabService: (serviceId: ServiceId) => void;
}

const NewTab: React.FC<NewTabProps> = ({ setTabService }) => {
  // const { requestAllServiceList, requestServiceList, availableServices, deleteService} = useDartStore();
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


  return (
    <div
      style={{
        height: "100%",
        maxHeight: "100%",
        boxSizing: "border-box",
        color: "#ffffffcc",
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
          flex: 1,
        }}
      >
        <div
          style={{
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
}

export default NewTab;

