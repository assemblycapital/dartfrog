import { useEffect, useRef, useState } from 'react';
import useChatStore from '../store/chat';
import { WEBSOCKET_URL, pokeSubscribe, pokeUnsubscribe } from '../utils';
import KinodeClientApi from "@kinode/client-api";
import { ConnectionStatusType } from '../types/types';

const ControlHeader = () => {

  const [ nodeConnected, setNodeConnected ] = useState(false);
  const { serverStatus, handleWsMessage, setApi, muteSoundEffects, setMuteSoundEffects } = useChatStore();
  const reconnectIntervalRef = useRef(null);

  useEffect(() => {
    const connectToKinode = () => {
      console.log("Attempting to connect to Kinode...");
      if (window.our?.node && window.our?.process) {
        const newApi = new KinodeClientApi({
          uri: WEBSOCKET_URL,
          nodeId: window.our.node,
          processId: window.our.process,
          onClose: (_event) => {
            console.log("Disconnected from Kinode");
            setNodeConnected(false);
          },
          onOpen: (_event, _api) => {
            console.log("Connected to Kinode");
            setNodeConnected(true);
            pokeSubscribe();
          },
          onMessage: (json, _api) => {
            handleWsMessage(json);
          },
          onError: (ev) => {
            console.log("Kinode connection error", ev);
            setNodeConnected(false);
          },
        });

        setApi(newApi);
      } else {
        setNodeConnected(false);
      }
    };

    if (nodeConnected) {
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
    } else {
      connectToKinode(); // Attempt to connect immediately on load
      if (!reconnectIntervalRef.current) {
        reconnectIntervalRef.current = setInterval(connectToKinode, 5*1000);
      }
    }

    return () => {
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
      }
    };
  }, [nodeConnected]);

  return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          color: "#ffffff55",
          fontSize: "0.8rem",
          gap: "0.8rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "0.8rem",
            flexGrow: 1,
          }}
        >
          <button onClick={() => {
              if(muteSoundEffects) {
                setMuteSoundEffects(false);
              } else {
                setMuteSoundEffects(true);
              }
            }}
            style={{
              opacity: "0.5",
              fontSize: "0.8rem",
              padding: "0px 2px",
            }}
            >
            {muteSoundEffects ? 'unmute' : 'mute'}
          </button>

        </div>

        <div>
          <span>
          {window.our.node} {' '} {nodeConnected ? 'connected': 'connecting...'}
          </span>
        </div>

      </div>

  );
}
export default ControlHeader;