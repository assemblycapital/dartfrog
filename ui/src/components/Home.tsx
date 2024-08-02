import React, { useEffect, useState } from 'react';
import useDartStore from '../store/dart';
import { getAllServicesFromPeerMap, getUniqueServices, sortServices } from '@dartfrog/puddle/index';
import ServiceList from './Services/ServiceList';
import PeerList from './Nodes/PeerList';
import ServiceCard from './Services/ServiceCard';
import { HomeIcon } from '@dartfrog/puddle/components/Icons';
import CurrentPageHeader from './CurrentPageHeader';
import { PROCESS_NAME } from '../utils';
import { useNavigate } from 'react-router-dom';
import Spinner from '@dartfrog/puddle/components/Spinner';

const Home: React.FC = () => {
  const {localServices, peerMap, setCurrentPage, isClientConnected} = useDartStore();
  const navigate = useNavigate();
  const [allServices, setAllServices] = useState([]);

  useEffect(() => {
    setCurrentPage('home');

    const updateServices = () => {
      const updatedServices = sortServices(getUniqueServices([...localServices, ...getAllServicesFromPeerMap(peerMap)]));
      setAllServices(updatedServices);
    };

    updateServices(); // Initial update

    const intervalId = setInterval(updateServices, 60000); // Update every 60 seconds

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, [localServices, peerMap]);

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
              marginTop:"1rem",
              overflow:"hidden",
            }}
          >
            <div
              style={{
                flex: "1",
                display: "flex",
                flexDirection: "row",
                width: "100%",
              }}
            >
              <div
                style={{
                  flex: "1",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  margin:"1rem",
                }}
              >
                <img 
                  src="https://bwyl.nyc3.digitaloceanspaces.com/kinode/dartfrog/chat_images/kino.webp"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
              <div
                style={{
                  flex: "1",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  padding:"2rem",
                }}
              >
                <div>
                  dartfrog v0.3.1
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                  }}
                >
                  secure subdomains, custom profiles, and more!
                </div>
              </div>
            </div>
            <div
              style={{
                flex: "2",
                display: "flex",
                flexDirection: "column",
                marginTop:"1rem",
                overflow:"hidden",
                // justifyContent: "center",
                // alignItems: "center",
                fontSize: "0.8rem",
                width: "100%",
                // height:"100%",
                // maxHeight:"100%",
              }}
            >
              {allServices.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap:"1rem",
                    justifyContent: "center",
                    alignItems: "center",
                    height:"100%",
                  }}
                >
                  <div
                    style={{
                      userSelect:"none",
                      height:"10vh",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    no known services..
                  </div>
                  <a
                    href={`/${PROCESS_NAME}/services`}
                    className='hover-dark-gray'
                    style={{
                      color: 'gray',
                      textAlign: 'center',
                      cursor: "pointer",
                      padding: "0.5rem 1rem",
                      width:"100%",
                      height:"10vh",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      border: "1px solid #333",
                    }}
                    onClick={(event) => {
                      event.preventDefault();
                      navigate('/services')
                    }}
                  >
                    create one
                  </a>

                </div>

              ) : (
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    overflow:"hidden",
                  }}
                >
                  <div
                    style={{
                      textAlign:"center",
                      color: '#9d9d9d',
                      backgroundColor: '#333',
                      userSelect:"none",
                      padding:"5px",
                    }}
                  >
                    join a service!
                  </div>
                  <div
                    style={{
                      overflow:"auto",
                    }}
                  >
                    {allServices.slice(0,10).map((service, index) => (
                      <ServiceCard key={index} service={service} />
                    ))}
                  </div>
                  <a
                    href={`/${PROCESS_NAME}/services`}
                    className='hover-dark-gray'
                    style={{
                      color: 'gray',
                      textAlign: 'center',
                      cursor: "pointer",
                      padding: "0.5rem 1rem",
                      width:"100%",
                      borderTop:"1px solid #333"
                    }}
                    onClick={(event) => {
                      event.preventDefault();
                      navigate('/services')
                    }}
                  >
                    see all
                  </a>
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