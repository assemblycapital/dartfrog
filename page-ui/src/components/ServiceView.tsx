import React, { useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import TopBar from '@dartfrog/puddle/components/TopBar';
import { ServiceApi, ServiceConnectionStatus, ServiceConnectionStatusType, ServiceMetadata } from '@dartfrog/puddle';
import { PROCESS_NAME, WEBSOCKET_URL, } from '../utils';
import useChatStore, { ChatState, ChatMessage } from '@dartfrog/puddle/store/chat';
import ChatBox from '@dartfrog/puddle/components/ChatBox';
import Spinner from '@dartfrog/puddle/components/Spinner';
import { maybePlaySoundEffect, maybePlayTTS } from '@dartfrog/puddle/utils';
import DisplayUserActivity from '@dartfrog/puddle/components/DisplayUserActivity';
import Split from 'react-split';
import usePageStore from '../store/page';
import PagePluginBox from './PagePluginBox';

const ServiceView = () => {
  const { id } = useParams<{ id: string }>();
  const paramServiceId = id

  const {
    setApi, api, serviceId, requestPeer, setPeerMap, setServiceId, setChatHistory,
    addChatMessage, chatState, setServiceConnectionStatus, serviceConnectionStatus,
    setServiceMetadata, serviceMetadata
  } = useChatStore();

  const {page, setPage} = usePageStore();


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
        } else if (msg.Page) {
          setPage(msg.Page.Page);
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
                <Split
                  sizes={[50, 50]}
                  minSize={[60, 60]}
                  direction="horizontal"
                  gutterSize={10}
                  style={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'row',
                    overflowX: 'hidden',
                    height:"100%",
                    maxHeight:"100%",
                    overflowY: 'hidden',
                  }}
                >

                <div>
                  <PagePluginBox />
                </div>
                <div
                  style={{
                    height: "100%",
                    maxHeight: "100%",
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    gap: "6px",
                  }}
                >
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <ChatBox chatState={chatState} />
                  </div>
                  <DisplayUserActivity metadata={serviceMetadata} />
                </div>
              </Split>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ServiceView;