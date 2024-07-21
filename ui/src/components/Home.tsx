import React, { useEffect } from 'react';
import useDartStore from '../store/dart';
import { getAllServicesFromPeerMap, getUniqueServices, sortServices } from '@dartfrog/puddle/index';
import ServiceList from './Services/ServiceList';
import PeerList from './Nodes/PeerList';
import ServiceCard from './Services/ServiceCard';

const Home: React.FC = () => {
  const {localServices, peerMap} = useDartStore();
  const allServices = sortServices(getUniqueServices([...localServices, ...getAllServicesFromPeerMap(peerMap)]));
  return (
    <div
      style={{
        height: "100%",
        maxHeight: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="current-page-header"
      >
        home
      </div>
      <div
        style={{
          flexGrow: "1",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            height: "100%",
            overflow:"hidden",
          }}
        >
          <div
            style={{
              flex: "2",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                flex: "1",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              join the hub
            </div>
            <div
              style={{
                flex: "1",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "0.8rem",
                width: "100%",
              }}
            >
              {allServices.length === 0 ? (
                <div>
                  no known services..
                </div>

              ) : (
                <div
                  style={{
                    width: "100%",
                  }}
                >
                  <ServiceCard service={allServices[0]} />
                  <div
                    className='hover-dark-gray'
                    style={{
                      color: 'gray',
                      textAlign: 'center',
                      cursor: "pointer",
                      padding: "0.5rem 1rem",
                    }}
                  >
                    see all
                  </div>
                </div>
              )}
            </div>
          </div>
          <div
            style={{
              flexGrow: "1",
              flex: "1",
              display: "flex",
              flexDirection: "column",
              overflow: 'hidden',
              margin: "1rem",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                overflowY: "scroll",
                flexGrow: 1,
              }}
            >
                <PeerList />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;