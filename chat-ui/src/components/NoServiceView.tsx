import React, { useEffect } from 'react';
import { ServiceApi }from "@dartfrog/puddle";
import { PROCESS_NAME } from '../App';
import { WEBSOCKET_URL } from '../utils';
import useChatStore from '@dartfrog/puddle/store/chat';

const NoServiceView = () => {
  const {api, setApi, createService, requestMyServices} = useChatStore();

  useEffect(()=>{
    const newApi = new ServiceApi({
      our: {
        "node": window.our?.node,
        "process": PROCESS_NAME,
      },
      websocket_url: WEBSOCKET_URL,
      onOpen: () => {
        requestMyServices();
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
    }}
  >
      <div>
        <div>
          services:
        </div>
        <div>
          todo
        </div>
      </div>
      <div
        style={{
          cursor:"pointer",
        }}
        onClick={()=> {
          createService("foo")

        }}
      >
        create a service
      </div>
    </div>
  );
};

export default NoServiceView;