import { ServiceApi } from '@dartfrog/puddle';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PROCESS_NAME, WEBSOCKET_URL } from '../utils';
import useServiceStore from '@dartfrog/puddle/store/service';
import styles from './Home.module.css';
import ConnectingAnimation from './ConnectingAnimation';

const Home: React.FC = () => {
  const {api, setApi, createService, deleteService, requestMyServices, setPeerMap, localServices, setLocalServices, isClientConnected, setIsClientConnected} = useServiceStore();

  const ourNode = window.our?.node;
  const navigate = useNavigate();

  useEffect(()=>{
    const newApi = new ServiceApi({
      our: {
        "node": ourNode,
        "process": PROCESS_NAME,
      },
      websocket_url: WEBSOCKET_URL,
      onOpen: (api) => {
        requestMyServices();
        setIsClientConnected(true);
      },
      onPeerMapChange(api) {
        setPeerMap(api.peerMap);
      },
      onLocalServicesChange(api) {
        setLocalServices(api.localServices)
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
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        boxSizing:"border-box",
        gap:"1rem",
        fontFamily:"monospace",
        color:"black",
        backgroundColor:"white",
        colorScheme: "light",

      }}
    >
      <div
        style={{
          display:"flex",
          flexDirection:"row",
          gap:"1rem",
        }}
      >
        <div>
          <img src="https://bwyl.nyc3.digitaloceanspaces.com/radio/radio_fit.png" alt="Radio" width="80px" height="80px" />
        </div>
        <div
          style={{
            display:"flex",
            flexDirection:"column",
            justifyContent:"center",
            gap:"0.5rem"

          }}
        >

          <div
            style={{
              fontSize: "1.5rem",
              fontWeight:"bold",
            }}
          >
            radio
          </div>
          <div>
            watch, listen, and chat together!
          </div>
        </div>
        <div
          style={{
            flexGrow:"1",
          }}
        />

        <div
          style={{
            display:"flex",
            flexDirection:"column",
            justifyContent:"center",
            padding:"1rem",

          }}
        >
          {window.our?.node}
        </div>
      </div>
      <div className={styles.navContainer}>
        <div className={styles.navItem}>
          home
        </div>
        <div>|</div>
        {['create', 'stations', 'media', 'help',].map((item) => (
          <div key={item} className={styles.navItem}>
            {item}
          </div>
        ))}
      </div>
      <div
        style={{
            display:"flex",
            flexDirection:"row",
            flexGrow:"1",

        }}
      >
        {!isClientConnected ? (
          <ConnectingAnimation />
        ) : (
          <div
            style={{
              flex:"1",
              display:"flex",
              flexDirection:"column",
            }}
          >
            <div>
              <div>
                join the hub
              </div>
              <div>
                4 online, 5 mins ago
              </div>
            </div>
            <div>
              create a new station
            </div>
          </div>
        )}
        <div
          style={{
            flex:"1",
            display:"flex",
            flexDirection:"column",
            gap:"0.5rem",
          }}
        >
          {localServices.map((service, index) => (
            <div key={index}
              style={{
              display:"flex",
              flexDirection:"column",
              gap:"0.5rem",

              }}
            >
              <div>
                <span
                  style={{
                    fontWeight:"bold"
                  }}
                >
                  title
                </span>
                <span>
                {' - '}
                </span>
                <span>
                  description
                </span>
              </div>
              <div
                style={{
                }}
              >
                df://{service.id.toString()}
              </div>
              <div
                style={{
                  marginLeft:"0.5rem",
                  display:"flex",
                  flexDirection:"column",
                  gap:"0.5rem",
                }}
                >
                <div
                  style={{
                    display:"flex",
                    flexDirection:"row",
                    gap:"1rem",
                  }}
                >
                  <div className={styles.actionButton}>
                    join
                  </div>
                  <div className={styles.actionButton}>
                    copy link
                  </div>
                  <div className={styles.actionButton}>
                    edit
                  </div>
                  <div className={styles.actionButton}>
                    delete
                  </div>
                </div>
                <div
                  style={{
                    display:"flex",
                    flexDirection:"row",
                    gap:"1rem",
                  }}
                >
                   <span>

                    4 online,
                   </span>
                   <span>
                    5 mins ago
                   </span>
                </div>
                <div
                  style={{
                    display:"flex",
                    flexDirection:"row",
                    gap:"1rem",
                  }}
                >
                  Now Playing: 
                  <span>{' '}</span>
                  <span> internet checkpoint - taia777 </span>
                </div>
              </div>
            </div>
          ))}

         
        </div>

      </div>
    </div>
  );
};

export default Home;