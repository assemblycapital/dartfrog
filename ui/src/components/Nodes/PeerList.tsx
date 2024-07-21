import React from 'react';
import { useNavigate } from 'react-router-dom';
import useDartStore from '../../store/dart';
import ProfilePicture from '../ProfilePicture';
import { getPeerNameColor } from '@dartfrog/puddle/index';
import { PROCESS_NAME } from '../../utils';

const PeerList = () => {
  const { peerMap } = useDartStore();
  const navigate = useNavigate();
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
        const activityTime = activity.timestamp * 1000;
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
      <a key={node}
        className="nodes-node-row hover-dark-gray"
        href={`/${PROCESS_NAME}/nodes/${node}`}
        onClick={(event) => {
          event.preventDefault()
          navigate(`/nodes/${node}`);
        }}
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
            <ProfilePicture size={"36px"} node={node} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span className={peer.peerData ? getPeerNameColor(peer) : 'color-gray'}>
                {node}
              </span>
              {peer.peerData?.profile.bio &&
                <span
                  style={{
                    fontSize: "0.8rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100px",
                    color:'gray',
                  }}
                >
                  {peer.peerData.profile.bio}
                </span>
              }
            </div>
          </div>
        </div>
      </a>
    ))
  );

  return (
    <div
      style={{
        display:"flex",
        flexDirection:"column",
        gap:"0.6rem",
        color: 'gray',
        height:"100%",
        overflowY:"scroll",
      }}
      >
      <div style={{ cursor: "default", fontSize:"0.8rem" }}>online: {activeLast5Minutes.length}</div>
      <div
        style={{
          borderLeft: "1px solid #333",
          marginLeft:"0.4rem",
        }}
      >

        {renderPeerList(activeLast5Minutes)}
      </div>

      <div style={{ cursor: "default", fontSize:"0.8rem" }}>recently online: {activeLast24Hours.length}</div>
      <div
        style={{
          borderLeft: "1px solid #333",
          marginLeft:"0.4rem",
        }}
      >
        {renderPeerList(activeLast24Hours)}
      </div>

      <div style={{ cursor: "default", fontSize:"0.8rem" }}>others: {others.length + nullPeerData.length}</div>
      <div
        style={{
          borderLeft: "1px solid #333",
          marginLeft:"0.4rem",
          height:"100%",
        }}
      >
        {renderPeerList(others)}
        {renderPeerList(nullPeerData)}
      </div>
    </div>
  );
};

export default PeerList;