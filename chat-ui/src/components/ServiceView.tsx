import React, { useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { HamburgerIcon } from './Icons';
import TopBar from './TopBar';
import { ServiceApi, ServiceMetadata } from '@dartfrog/puddle';
import { PROCESS_NAME } from '../App';
import { WEBSOCKET_URL } from '../utils';
import useChatStore from '../store/chat';

const ServiceView = () => {
  const { id } = useParams<{ id: string }>();
  const serviceId = id

  const {setApi, api, setServiceConnectionStatus, serviceConnectionStatus, setServiceMetadata, serviceMetadata} = useChatStore();

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
      },
      onServiceConnectionStatusChange(api) {
        console.log("new service connection status", api.serviceConnectionStatus);
        setServiceConnectionStatus(api.serviceConnectionStatus)
      },
      onServiceMetadataChange(api) {
        console.log("new service metadata", api.serviceMetadata);
        setServiceMetadata(api.serviceMetadata)
      },

    });
    setApi(newApi);

    const handleBeforeUnload = () => {
      newApi.unsubscribeService();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
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
      <div>
        {serviceConnectionStatus && serviceConnectionStatus.toString()}
      </div>
      <div>

        {JSON.stringify(serviceMetadata)}
      </div>

    </div>
  );
};

export default ServiceView;