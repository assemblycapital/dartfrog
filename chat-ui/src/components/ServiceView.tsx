import React, { useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { HamburgerIcon } from './Icons';
import TopBar from './TopBar';
import { ServiceApi } from '@dartfrog/puddle';
import { PROCESS_NAME } from '../App';
import { WEBSOCKET_URL } from '../utils';
import useChatStore from '../store/chat';

const ServiceView = () => {
  const { id } = useParams<{ id: string }>();
  const serviceId = id

  const {setApi} = useChatStore();

  useEffect(()=>{
    const newApi = new ServiceApi({
      our: {
        "node": window.our?.node,
        "process": PROCESS_NAME,
      },
      serviceId: serviceId,
      websocket_url: WEBSOCKET_URL,
      onOpen: (api) => {
        // requestMyServices();
        console.log("connected to kinode", api.serviceId)
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
      <TopBar serviceId={serviceId}/>

      <h1>Service View</h1>
      <p>This is the Service View component.</p>
      <p>{serviceId}</p>
    </div>
  );
};

export default ServiceView;