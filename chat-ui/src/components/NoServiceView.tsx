import React, { useEffect } from 'react';
import { getServiceRecencyText, ServiceApi }from "@dartfrog/puddle";
import { PROCESS_NAME } from '../App';
import { WEBSOCKET_URL } from '../utils';
import useChatStore from '@dartfrog/puddle/store/chat';
import { useNavigate } from 'react-router-dom';

const NoServiceView = () => {
  const {api, setApi, createService, deleteService, requestMyServices, setPeerMap, localServices, setLocalServices,} = useChatStore();

  const navigate = useNavigate();

  useEffect(()=>{
    const newApi = new ServiceApi({
      our: {
        "node": window.our?.node,
        "process": PROCESS_NAME,
      },
      websocket_url: WEBSOCKET_URL,
      onOpen: (api) => {
        requestMyServices();
      },
      onPeerMapChange(api) {
        setPeerMap(api.peerMap);
      },
      onLocalServicesChange(api) {
        setLocalServices(api.localServices)
      }
    });
    setApi(newApi);
  }, [])

  return (
    <div
    style={{
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      boxSizing:"border-box",
      gap:"1rem"
    }}
  >
      <div>
        <div
          style={{
            fontSize:"0.8rem",
            textAlign:"center",
            userSelect:"none",
            color: '#9d9d9d',
            backgroundColor: '#333',
            padding:"5px",
          }}
        >
          services:
        </div>
        <div
          style={{
            userSelect:"none",
            display: 'flex',
            flexDirection: 'column',
            fontSize:"0.8rem",
            maxHeight:"300px",
            overflowY:"scroll",
          }}
        >
          {localServices.map((service, index) => (
            <div key={index}
              className="service-list-item"
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: "5px",
                alignItems: "center",
                borderBottom: "1px solid #333",
              }}
            >
              <div
              style={{
                flex:"1",
                display: 'flex',
                flexDirection: 'row',
                gap:"5px",
              }}
              >
                <a
                  className="join-button"
                  style={{
                    flex:"1",
                    cursor:"pointer"
                  }}
                  href={`/${PROCESS_NAME}/df/service/${service.id.toString()}`}
                  onClick={(e)=>{
                    e.preventDefault();
                    navigate(`/df/service/${service.id.toString()}`)
                  }}
                >
                  join
                </a>
                <div
                  className="delete-button"
                  style={{
                    flex:"1",
                    cursor:"pointer"
                  }}
                  onClick={()=>{
                    deleteService(service.id.name)
                  }}
                >
                  delete
                </div>
              </div>
              <div
                style={{
                  flex:"2",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {service.id.toShortString()}
              </div>
              <div
                style={{
                  flex:"1",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {service.meta.subscribers.length} online
              </div>
              <div
                style={{
                  flex:"1",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {getServiceRecencyText(service)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>

        <button
          style={{
            cursor:"pointer",
            width:"auto",
            padding:"1rem",
          }}
          onClick={() => {
            const randomNumber = Math.floor(Math.random() * 10000) + 1;
            createService(randomNumber.toString(), 'Public', 'Visible', [])
          }}
        >
          create a service
        </button>
      </div>
    </div>
  );
};

export default NoServiceView;