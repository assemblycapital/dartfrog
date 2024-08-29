import { nodeProfileLink, ServiceApi } from '@dartfrog/puddle';
import React, { useEffect } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { PROCESS_NAME, WEBSOCKET_URL } from '../utils';
import useServiceStore from '@dartfrog/puddle/store/service';
import styles from './Home.module.css';
import ConnectingAnimation from './ConnectingAnimation';
import InnerHome from './InnerHome';
import CreatePage from './CreatePage';
import StationsPage from './StationsPage';
import MediaPage from './MediaPage';
import HelpPage from './HelpPage';

const Home: React.FC = () => {
  const { api, setApi, createService, deleteService, requestMyServices, setPeerMap, localServices, setLocalServices, isClientConnected, setIsClientConnected } = useServiceStore();

  const ourNode = window.our?.node;
  const baseOrigin = window.origin.split(".").slice(1).join(".")
  const navigate = useNavigate();

  useEffect(() => {
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
        // paddingTop: '0px',
        boxSizing: "border-box",
        gap: "1rem",
        fontFamily: "monospace",
        // color: "black",
        // backgroundColor: "white",
        // colorScheme: "light",

      }}
    >
      {/* <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "1rem",
        }}
      >
        <div>
          <img src="https://bwyl.nyc3.digitaloceanspaces.com/radio/radio_fit.png" alt="Radio" width="60px" height="60px" />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "0.5rem"

          }}
        >

          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
            }}
          >
            radio
          </div>
          <div>
            watch, listen, and chat together
          </div>
        </div>
        <div
          style={{
            flexGrow: "1",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <a
            href={nodeProfileLink(window.our?.node, baseOrigin)}
            style={{
              color:"black",
              display:"inline-block",
              cursor:"pointer",
            }}
          >
            {window.our?.node}
          </a>
        </div>
      </div> */}
      <div className={styles.navContainer}>
        <div
          style={{
            display:"flex",
            flexDirection:"row",
            gap:"0.5rem",

          }}
        >
          <a
            className={`${styles.navItem} df`}
            href={`http://${baseOrigin}/dartfrog:dartfrog:herobrine.os`}
          >
            df
          </a>
          <Link to="/" className={styles.navItem}>radio</Link>
        </div>
        {['create', 'stations', 'media'].map((item) => (
          <Link key={item} to={`/${item}`}
            className={`${styles.navItem} df`}
          >
            {item}
          </Link>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexGrow: "1",
        }}
      >
        {!isClientConnected ? (
          <ConnectingAnimation />
        ) : (
          <Routes>
            <Route path="/" element={<InnerHome />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/stations" element={<StationsPage />} />
            <Route path="/media" element={<MediaPage />} />
            <Route path="/help" element={<HelpPage />} />
          </Routes>
        )}
      </div>
    </div>
  );
};

export default Home;