import React, { useEffect } from 'react';
import useDartStore from '../store/dart';
import { getAllServicesFromPeerMap, getUniqueServices } from '@dartfrog/puddle/index';
import ServiceList from './Services/ServiceList';
import PeerList from './Nodes/PeerList';

const Home: React.FC = () => {
  const {localServices, peerMap} = useDartStore();
  const allServices = getUniqueServices([...localServices, ...getAllServicesFromPeerMap(peerMap)]);
  return (
    <div
      style={{
        height:"100%",
        display:"flex",
        flexDirection:"column",
      }}
    >
      <div
        className="current-page-header"
      >
        home
      </div>
      <div
        style={{
          flexGrow:"1",
          display: "flex",
          flexDirection:"column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection:"row",
            width:"100%",
            height:"100%",
          }}
        >
          <div
            style={{
              flex:"2",
              display: "flex",
              flexDirection:"column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                flex:"1",
                display: "flex",
                flexDirection:"column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              join the hub
            </div>
            <div
              style={{
                flex:"1",
                display: "flex",
                flexDirection:"column",
                justifyContent: "center",
                alignItems: "center",
                fontSize:"0.8rem",
              }}
            >
              <ServiceList services={allServices} />
            </div>
          </div>
          <div
            style={{
              flex:"1",
              display: "flex",
              flexDirection:"column",
              // justifyContent: "center",
              // alignItems: "center",
            }}
          >
            <PeerList />
          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;