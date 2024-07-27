import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import TopBar from '@dartfrog/puddle/components/TopBar';
import { ServiceApi, ServiceConnectionStatus, ServiceConnectionStatusType, ServiceID, ServiceMetadata } from '@dartfrog/puddle';
import useChatStore, { ChatState, ChatMessage } from '@dartfrog/puddle/store/chat';
import ChatBox from '@dartfrog/puddle/components/ChatBox';
import Spinner from '@dartfrog/puddle/components/Spinner';
import { maybePlaySoundEffect, maybePlayTTS } from '@dartfrog/puddle/utils';
import DisplayUserActivity from '@dartfrog/puddle/components/DisplayUserActivity';
import Split from 'react-split';

const SplitComponent = Split as unknown as React.FC<any>;

interface HalfChatProps {
  onServiceMessage?: (msg: any) => void;
  onClientMessage?: (msg: any) => void;
  Element?: React.ComponentType<{ }>;
  processName: string;
  ourNode: string;
  websocketUrl?: string;
}

const HalfChat: React.FC<HalfChatProps> = ({ onServiceMessage, onClientMessage, Element, processName, websocketUrl, ourNode}) => {
  const { id } = useParams<{ id?: string; }>();
  const paramServiceId = id ?? '';
  const [isApiConnected, setIsApiConnected] = useState(false);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const isPageVisible = useRef(true);

  const {
    setApi, api, serviceId, requestPeer, setPeerMap, setServiceId, setChatHistory,
    addChatMessage, chatState, setServiceConnectionStatus, serviceConnectionStatus,
    setServiceMetadata, serviceMetadata
  } = useChatStore();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPageVisible.current = false;
      } else {
        isPageVisible.current = true;
        setUpdateCount(0);
      }
      updateTitle();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const updateTitle = () => {
    if (paramServiceId) {
      const shortServiceId = ServiceID.fromString(paramServiceId).toShortString();
      document.title = (isPageVisible.current || updateCount === 0)
        ? shortServiceId
        : `${shortServiceId} (${updateCount})`;
    }
  };

  useEffect(() => {
    updateTitle();
  }, [paramServiceId, updateCount]);

  const createServiceApi = () => {
    const newApi = new ServiceApi({
      our: {
        "node": ourNode,
        "process": processName,
      },
      serviceId: paramServiceId,
      websocket_url: websocketUrl,
      onServiceConnectionStatusChange(api) {
        setServiceConnectionStatus(api.serviceConnectionStatus)
      },
      onServiceMetadataChange(api) {
        setServiceMetadata(api.serviceMetadata)
        if (!isPageVisible.current) {
          setUpdateCount(prevCount => prevCount + 1);
        }
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
        onServiceMessage?.(msg);
        if (!isPageVisible.current) {
          setUpdateCount(prevCount => prevCount + 1);
        }
      },
      onClientMessage(msg) {
        onClientMessage?.(msg);
        if (!isPageVisible.current) {
          setUpdateCount(prevCount => prevCount + 1);
        }
      },
      onOpen: (api) => {
        setIsApiConnected(true);
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      },
      onClose() {
        setIsApiConnected(false);
        scheduleReconnect();
      },
    });
    setApi(newApi);
    return newApi;
  };

  useEffect(() => {
    setServiceId(paramServiceId);
    const newApi = createServiceApi();

    const handleBeforeUnload = () => {
      newApi.unsubscribeService();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, [paramServiceId]);

  const scheduleReconnect = () => {
    if (!reconnectTimer.current) {
      reconnectTimer.current = setTimeout(() => {
        createServiceApi();
        reconnectTimer.current = null;
      }, 5000);
    }
  };

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
      <TopBar serviceId={paramServiceId} />
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
                <SplitComponent
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

                <div
                  style={{
                    display:"flex",
                    flex:"1",
                    flexDirection:"column",
                    height:"100%",
                  }}
                >
                  {Element && <Element />}
                </div>
                <div
                  style={{
                    height: "100%",
                    maxHeight: "100%",
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    gap: "6px",
                    marginLeft:"8px",
                  }}
                >
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <ChatBox chatState={chatState} />
                  </div>
                  <DisplayUserActivity metadata={serviceMetadata} />
                </div>
              </SplitComponent>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HalfChat;