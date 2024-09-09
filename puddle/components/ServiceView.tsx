import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import TopBar from '@dartfrog/puddle/components/TopBar';
import { ServiceApi, ServiceConnectionStatus, ServiceConnectionStatusType, ServiceID, ServiceMetadata } from '@dartfrog/puddle';
import useChatStore, { ChatState, ChatMessage } from '@dartfrog/puddle/store/service';
import ChatBox from '@dartfrog/puddle/components/ChatBox';
import Spinner from '@dartfrog/puddle/components/Spinner';
import { maybePlaySoundEffect, maybePlayTTS } from '@dartfrog/puddle/utils';
import DisplayUserActivity from '@dartfrog/puddle/components/DisplayUserActivity';

interface ServiceViewProps {
  onServiceMessage?: (msg: any) => void;
  onClientMessage?: (msg: any) => void;
  Element?: React.ComponentType<{ }>;
  processName: string;
  ourNode: string;
  websocketUrl?: string;
  enableChatSounds?: boolean;
  fullscreen?: boolean;
}

export const renderConnectionStatus = (
  serviceConnectionStatus: ServiceConnectionStatus | null,
  isConnectingTooLong: boolean
): React.ReactNode => {
  const baseOrigin = window.origin.split(".").slice(1).join(".")
  const containerStyle: React.CSSProperties = {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "1rem",
    color: "gray",
    userSelect: "none",
  };

  if (!serviceConnectionStatus) {
    return (
      <div style={containerStyle}>
        <div>connecting to client...</div>
        <Spinner />
      </div>
    );
  }

  if (serviceConnectionStatus.status === ServiceConnectionStatusType.Connecting) {
    return (
      <div style={containerStyle}>
        <div>{isConnectingTooLong ? "bad connection to host..." : "connecting to host..."}</div>
        <Spinner />
      </div>
    );
  }

  if (serviceConnectionStatus.status === ServiceConnectionStatusType.ServiceDoesNotExist) {
    return (
      <div style={containerStyle}>
        <div>
          this service doesn't exist
        </div>
        <div>
          <a
            href={`http://${baseOrigin}/dartfrog:dartfrog:herobrine.os`}
          >

            <button
              style={{
                padding:"1rem",
                width:"auto",
              }}
            >
              home
            </button>
          </a>

        </div>
      </div>
    )
  }

  if (serviceConnectionStatus.status !== ServiceConnectionStatusType.Connected) {
    return (
      <div style={containerStyle}>
        {serviceConnectionStatus.toString()}
      </div>
    );
  }

  return null;
};

const ServiceView : React.FC<ServiceViewProps> = ({ onServiceMessage, onClientMessage, Element, processName, websocketUrl, ourNode, enableChatSounds = false, fullscreen = false }) => {
  const { id } = useParams<{ id?: string; }>();
  const paramServiceId = id ?? '';
  const [isApiConnected, setIsApiConnected] = useState(false);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const isPageVisible = useRef(true);
  const [isConnectingTooLong, setIsConnectingTooLong] = useState(false);

  const {
    setApi, api, serviceId, requestPeer, setPeerMap, setServiceId, setChatHistory,
    addChatMessage, chatState, setServiceConnectionStatus, serviceConnectionStatus,
    setServiceMetadata, serviceMetadata, setChatSoundsEnabled,
    setFullServiceMetadata,
  } = useChatStore();

  useEffect(()=> {
    setChatSoundsEnabled(enableChatSounds)
  }, [enableChatSounds]);

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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (serviceConnectionStatus?.status === ServiceConnectionStatusType.Connecting) {
      timer = setTimeout(() => {
        setIsConnectingTooLong(true);
      }, 5000);
    } else {
      setIsConnectingTooLong(false);
    }
    return () => clearTimeout(timer);
  }, [serviceConnectionStatus]);

  const updateTitle = () => {
    if (paramServiceId) {
      const shortServiceId = ServiceID.fromString(paramServiceId).toShortString();
      document.title = (isPageVisible.current || updateCount === 0)
        ? shortServiceId
        : `(${updateCount}) ${shortServiceId}`;
    }
  };

  useEffect(() => {
    updateTitle();
  }, [paramServiceId, updateCount]);

  const createServiceApi = () => {
    const newApi = new ServiceApi({
      our: {
        node: ourNode,
        process: processName,
      },
      serviceId: paramServiceId,
      websocket_url: websocketUrl,
      onServiceConnectionStatusChange(api) {
        setServiceConnectionStatus(api.serviceConnectionStatus)
      },
      onServiceMetadataChange(api) {
        if (!isPageVisible.current) {
          if (api.serviceMetadata && serviceMetadata && serviceMetadata.subscribers !== api.serviceMetadata.subscribers) {
            // somebody joined or left, otherwise, dont update the count
            setUpdateCount(prevCount => prevCount + 1);
          }
        }
        setServiceMetadata(api.serviceMetadata)
      },
      onFullServiceMetadataChange(api) {

        setFullServiceMetadata(api.fullServiceMetadata)
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

  if (fullscreen) {
      const status = renderConnectionStatus(serviceConnectionStatus, isConnectingTooLong);
      if (status) return status;
      return <Element />;
  }

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
        {renderConnectionStatus(serviceConnectionStatus, isConnectingTooLong) || (
          <div
            style={{
              display:"flex",
              flex:"1",
              flexDirection:"column",
              height:"100%",
            }}
          >
            <Element />
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceView;