import React, { useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { ServiceApi, ServiceConnectionStatus, ServiceConnectionStatusType, ServiceMetadata, useServiceStore, TopBar, Spinner, ChatBox, DisplayUserActivity } from '@dartfrog/puddle';
import { PROCESS_NAME } from '../App';
import { WEBSOCKET_URL, } from '../utils';

const ServiceView = () => {
  const { id } = useParams<{ id: string }>();
  const paramServiceId = id

  const {
    setApi, api, serviceId, requestPeer, setPeerMap, setServiceId, setChatHistory,
    addChatMessage, chatState, setServiceConnectionStatus, serviceConnectionStatus,
    setServiceMetadata, serviceMetadata
  } = useServiceStore();

  useEffect(() => {
    setServiceId(paramServiceId);
    const newApi = new ServiceApi({
      our: {
        "node": window.our?.node,
        "process": PROCESS_NAME,
      },
      serviceId: paramServiceId,
      websocket_url: WEBSOCKET_URL,
      onOpen: (api) => {
        // 
      },
      onServiceConnectionStatusChange(api) {
        setServiceConnectionStatus(api.serviceConnectionStatus)
      },
      onServiceMetadataChange(api) {
        setServiceMetadata(api.serviceMetadata)
      },
      onPeerMapChange(api) {
        setPeerMap(api.peerMap);
      },
      onServiceMessage(msg) {
        if (msg.Chat) {
          if (msg.Chat.FullMessageHistory) {
            setChatHistory(msg.Chat.FullMessageHistory)
          } else if (msg.Chat.Message) {
            const chatMessage = msg.Chat.Message;
            addChatMessage(chatMessage);
          }
        }
      },
      onClientMessage(msg) {
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
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        boxSizing: "border-box",
      }}
    >
      <div style={{ flex: '0 1 auto',
        overflow:"hidden",
      }}>
        <TopBar serviceId={paramServiceId} />
      </div>
      <div
        style={{
          flex: '1 1 100%',
          maxHeight: "100%",
          overflow: 'auto',
        }}
      >
        {!serviceConnectionStatus ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "1rem",
              color: "gray",
              userSelect: "none",
            }}
          >
            <div>
              loading...
            </div>
            <Spinner />
          </div>
        ) : (
          <>
            {serviceConnectionStatus.status !== ServiceConnectionStatusType.Connected ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "1rem",
                  userSelect: "none",
                }}
              >
                {serviceConnectionStatus.toString()}
              </div>
            ) : (
              <div
                style={{
                  height: "100%",
                  maxHeight: "100%",
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  gap: "6px",
                  // marginLeft:"8px",
                }}
              >
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <ChatBox chatState={chatState} />
                </div>
                <DisplayUserActivity metadata={serviceMetadata} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ServiceView;