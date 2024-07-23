import React, { useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { HamburgerIcon } from './Icons';
import TopBar from './TopBar';
import { ServiceApi, ServiceConnectionStatus, ServiceConnectionStatusType, ServiceMetadata } from '@dartfrog/puddle';
import { PROCESS_NAME } from '../App';
import { WEBSOCKET_URL, } from '../utils';
import useChatStore, { ChatState, ChatMessage} from '@dartfrog/puddle/store/chat';
import ChatBox from '@dartfrog/puddle/components/ChatBox';
import { maybePlaySoundEffect, maybePlayTTS } from '@dartfrog/puddle/utils';

const ServiceView = () => {
  const { id } = useParams<{ id: string }>();
  const paramServiceId = id

  const {setApi, api, serviceId, requestPeer, setPeerMap, setServiceId, setChatHistory, addChatMessage, chatState, setServiceConnectionStatus, serviceConnectionStatus, setServiceMetadata, serviceMetadata} = useChatStore();

  useEffect(()=>{
    setServiceId(paramServiceId);
    const newApi = new ServiceApi({
      our: {
        "node": window.our?.node,
        "process": PROCESS_NAME,
      },
      serviceId: paramServiceId,
      websocket_url: WEBSOCKET_URL,
      onOpen: (api) => {
        // requestMyServices();
        // console.log("connected to kinode", api.serviceId)
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
        // no client messages in chat
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
        boxSizing:"border-box",
      }}
    >
      <div
        style={{ flex: '0 1 auto' }}
      >

        <TopBar serviceId={paramServiceId} />
      </div>
      <div
        style={{
          flex: '1 1 100%',
          maxHeight:"100%",
          overflow: 'auto',
        }}
      >
        {!serviceConnectionStatus ? (
            "loading..."
          ):(
            <>
              {serviceConnectionStatus.status !== ServiceConnectionStatusType.Connected ? (

                <div>
                  {serviceConnectionStatus.toString()}
                </div>
              ) : ( 
                <ChatBox chatState={chatState} />
              )
              }
            </>
        )}

      </div>
    </div>
  );
};

export default ServiceView;