import React, { useEffect, useState, useCallback } from 'react';
import useDartStore from '../../store/dart';
import { useNavigate } from 'react-router-dom';
import { getPeerNameColor, getPeerPfp } from '@dartfrog/puddle/index';
import ProfilePicture from '../ProfilePicture';
import './Nodes.css';

const Nodes: React.FC = () => {
  const { peerMap, localFwdPeerRequest } = useDartStore();
  const [inputValue, setInputValue] = useState('');

  const navigate = useNavigate();

  const handleSubmit = useCallback(() => {
    if (inputValue === "") return;
    navigate(`/nodes/${inputValue}`)
  }, [inputValue]);

  const now = Date.now();

  const nullPeerData = [];
  const activeLast5Minutes = [];
  const activeLast24Hours = [];
  const others = [];

  peerMap.forEach((peer, node) => {
    if (!peer.peerData) {
      nullPeerData.push([node, peer]);
    } else {
      const activity = peer.peerData.activity;
      if (activity.type === 'Online' || activity.type === 'Offline') {
        const activityTime = activity.timestamp*1000;
        if (now - activityTime <= 5 * 60 * 1000 && activity.type === 'Online') {
          activeLast5Minutes.push([node, peer]);
        } else if (now - activityTime <= 24 * 60 * 60 * 1000) {
          activeLast24Hours.push([node, peer]);
        } else {
          others.push([node, peer]);
        }
      } else {
        others.push([node, peer]);
      }
    }
  });

  // Sort activeLast24Hours by most recent activity
  activeLast24Hours.sort((a, b) => b[1].peerData.activity.timestamp - a[1].peerData.activity.timestamp);

  const renderPeerList = (peers) => (
    peers.map(([node, peer]) => (
      <div key={node}
        className="nodes-node-row"
        onClick={() => navigate(`/nodes/${node}`)}
      >
        <div
          style={{
            cursor: "pointer",
            display: "inline-block",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "1rem",
              alignItems: "center"
            }}
          >
            <ProfilePicture size={"48px"} node={node} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",

              }}

            >
              <span className={peer.peerData ? getPeerNameColor(peer) : 'gray'}>
                {node}
              </span>
              {peer.peerData?.profile.bio &&
                <span
                  style={{
                    fontSize:"0.8rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100px"
                  }}
                >
                  {peer.peerData.profile.bio}
                </span>
              }

            </div>

          </div>
        </div>
      </div>
    ))
  );

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="current-page-header">
        nodes
      </div>

      <div style={{ marginTop: "1rem" }}>
        <input 
          type="text" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
        />
        <button onClick={handleSubmit}>find</button>
      </div>

      <div style={{ marginTop: "1rem", color: 'gray' }}>

        <div
          style={{ cursor:"default" }}
        >
          online:
        </div>
        {renderPeerList(activeLast5Minutes)}

        <div
          style={{ cursor:"default" }}
        >
          recently online:
        </div>
        {renderPeerList(activeLast24Hours)}

        <div
          style={{ cursor:"default" }}
        >
          others:
        </div>
        {renderPeerList(others)}

        {renderPeerList(nullPeerData)}

      </div>
    </div>
  );
};

export default Nodes;