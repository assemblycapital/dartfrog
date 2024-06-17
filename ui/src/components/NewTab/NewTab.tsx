import DisplayUserActivity from "../DisplayUserActivity";
import ChatBox from "../ChatBox";
import ChatHeader from "../ChatHeader";
import { useCallback, useEffect, useState } from "react";
import Spinner from "../Spinner";
import useDartStore from "../../store/dart";
import { AvailableServices, ParsedServiceId, Service, ServiceConnectionStatus, ServiceConnectionStatusType, ServiceId, makeServiceId } from "@dartfrog/puddle";
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

  const [ myServices, setMyServices ] = useState<ParsedServiceId[]>([]);
  const [ otherServices, setOtherServices ] = useState<ParsedServiceId[]>([]);
  useEffect(() => {
    requestAllServiceList();
  }, []);

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
        minHeight: "400px",
        padding: "4px",
        color: "#ffffffcc",
        fontSize: "0.8rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.8rem",
      }}
    >
        <CreateService />
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
              userSelect: "none",

            }}
          >
            my services:
          </div>
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
                    color: "#ff666699"
                  }}
                  onClick={() => {
                    deleteService(makeServiceId(service.node, service.id));
                    requestServiceList(window.our?.node);
                  }}
                >
                  delete
                </button>
                <span
                  style={{
                    cursor: "default",
                    // userSelect: "none",
                    alignContent: "center",
                  }}
                >
                  {makeServiceId(service.node, service.id)}
                  </span>
              </div>
            ))}
      </div>
      <div>
        <div
          style={{
            marginBottom: "0.8rem",
            cursor: "default",
            userSelect: "none",
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
                    // userSelect: "none",
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
  );
}


export default NewTab;
