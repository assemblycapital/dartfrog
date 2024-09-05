import React, { useEffect, useState, useCallback } from 'react';
import { ServiceApi, ServiceID } from '@dartfrog/puddle';
import useServiceStore from '@dartfrog/puddle/store/service';
import useRumorsStore from '../store/rumors';
import { PROCESS_NAME, WEBSOCKET_URL } from '../utils';


interface RumorsHomeProps {
}

const RumorsHome: React.FC = ({ }) => {
  const [isAuthor, setIsAuthor] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const {api, setApi, setIsClientConnected, setPeerMap, } = useServiceStore();
  const {createRumor} = useRumorsStore();

  const ourNode = window.our?.node;

  useEffect(() => {
    const newApi = new ServiceApi({
      our: {
        "node": ourNode,
        "process": PROCESS_NAME,
      },
      websocket_url: WEBSOCKET_URL,
      onOpen: (api) => {
        setIsClientConnected(true);
      },
      onProcessMessage(message) {
        console.log("rumors message", message)
      },
      onPeerMapChange(api) {
        setPeerMap(api.peerMap);
      },
      onClose() {
        setIsClientConnected(false);
      },
    });
    setApi(newApi);
  }, [ourNode])


  return (
    <div
      style={{
        // height: '500px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        // border: '1px solid red',
      }}
    >
      TODO rumors home
      <button
        onClick={()=>{
          createRumor(api, "TODO")
        }}
      >
        test
      </button>
    </div>
  )
};

export default RumorsHome;
