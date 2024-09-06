import React, { useEffect, useState } from 'react';
import { ServiceApi } from '@dartfrog/puddle';
import useServiceStore from '@dartfrog/puddle/store/service';
import useRumorsStore from '../store/rumors';
import { PROCESS_NAME, WEBSOCKET_URL } from '../utils';
import { Routes, Route, Link, useLocation } from 'react-router-dom';

const RumorsHome: React.FC = () => {
  const { api, setApi, setIsClientConnected, setPeerMap } = useServiceStore();
  const { createRumor, handleUpdate, rumors } = useRumorsStore();
  const [newRumorText, setNewRumorText] = useState('');

  const ourNode = window.our?.node;

  useEffect(() => {
    const newApi = new ServiceApi({
      our: {
        "node": ourNode,
        "process": PROCESS_NAME,
      },
      websocket_url: WEBSOCKET_URL,
      onOpen: (api) => {
        api.requestKnownPeers();
        setIsClientConnected(true);
      },
      onProcessMessage(message) {
        console.log("rumors message", message)
        handleUpdate(message)
      },
      onPeerMapChange(api) {
        setPeerMap(api.peerMap);
      },
      onClose() {
        setIsClientConnected(false);
      },
    });
    setApi(newApi);
  }, [ourNode]);

  // Sort rumors by time (descending order)
  const sortedRumors = [...rumors].sort((a, b) => b.time - a.time);

  const handleCreateRumor = () => {
    if (newRumorText.trim()) {
      createRumor(api, newRumorText.trim());
      setNewRumorText('');
    }
  };

  const location = useLocation();
  const baseOrigin = window.origin.split(".").slice(1).join(".")

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        padding: '20px',
      }}
    >
      <nav style={{ marginBottom: '20px' }}>
        <a
          href={`http://${baseOrigin}/dartfrog:dartfrog:herobrine.os/`}
          style={{
            marginRight:"1rem"
          }}
          >
            df
        </a>
        <Link to="/" style={{ marginRight: '15px' }}>rumors</Link>
      </nav>

      <Routes>
        <Route path="/" element={
          <>
            <div style={{ display: 'flex', gap: '20px' }}>
                todo default hub service here
              
            </div>
          </>
        } />
      </Routes>
    </div>
  );
};

export default RumorsHome;
