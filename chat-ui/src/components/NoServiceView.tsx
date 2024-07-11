import React from 'react';
import KinodeClientApi from "@kinode/client-api";
import { PROCESS_NAME } from '../App';
import { WEBSOCKET_URL } from '../utils';

const NoServiceView = () => {

  const newApi = new KinodeClientApi({
    uri: WEBSOCKET_URL,
    nodeId: window.our?.node,
    processId: PROCESS_NAME,
    onClose: (event) => {
      console.log("Disconnected from Kinode");
    },
    onOpen: (event, api) => {
      console.log("Connected to Kinode");
    },
    onMessage: (json, api) => {
      console.log("update")
    },
    onError: (event) => {
      console.log("Kinode connection error", event);
    },
  });

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
      <div>
        create a service
      </div>
    </div>
  );
};

export default NoServiceView;