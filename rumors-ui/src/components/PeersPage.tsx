import React, { useState } from 'react';
import useServiceStore from '@dartfrog/puddle/store/service';
import useRumorsStore from '../store/rumors';

const PeersPage: React.FC = () => {
  const { peerMap, setPeerMap } = useServiceStore();
  const [newPeerName, setNewPeerName] = useState('');
  const [newPeerAddress, setNewPeerAddress] = useState('');
  const [editingPeer, setEditingPeer] = useState<string | null>(null);

  const { createRumor, handleUpdate, peers } = useRumorsStore();

  const renderPeerMap = () => (
    <div style={{ marginTop: '20px' }}>
      <h2>Service Peers</h2>
      {peerMap.size > 0 ? (
        <ul>
          {Array.from(peerMap).map(([node, peer]) => (
            <li key={node}>
              <span>{node}</span>
              {peer.peerData?.profile.bio && (
                <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: 'gray' }}>
                  {peer.peerData.profile.bio}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No peers in peerMap</p>
      )}
    </div>
  );

  return (
    <div>
      <div>
        <input
          type="text"
          value={newPeerName}
          onChange={(e) => setNewPeerName(e.target.value)}
          placeholder="Peer Name"
        />
        <button onClick={()=>{
          // todo

        }}>
          Add Peer
        </button>
      </div>

      {renderPeerMap()}

      <div style={{ marginTop: '20px' }}>
        <h2>Rumors Peers</h2>
        {peers.length > 0 ? (
          <ul>
            {peers.map((peer, index) => (
              <li key={index}>{peer}</li>
            ))}
          </ul>
        ) : (
          <p>No Rumors peers available</p>
        )}
      </div>
    </div>
  );
};

export default PeersPage;
