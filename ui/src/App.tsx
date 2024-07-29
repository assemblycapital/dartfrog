import KinodeClientApi from "@kinode/client-api";
import "./App.css";
import Footer from "./components/Footer";
import ControlHeader from "./components/ControlHeader";
import { useEffect, useRef, useState } from "react";
import { PROCESS_NAME, WEBSOCKET_URL, } from './utils';
import { Service, ServiceConnectionStatusType, peerFromJson, profileFromJson, serviceFromJson, } from "@dartfrog/puddle";
import useDartStore, { CHAT_PLUGIN, CHESS_PLUGIN, MessageStore, PAGE_PLUGIN, PIANO_PLUGIN } from "./store/dart";
import BrowserBox from "./components/BrowserBox";
import TabbedWindowManager from "./components/TabbedWindowManager";
import Sidebar from "./components/Sidebar/Sidebar";
import Middle from "./components/Middle";
import AuthDialog from "./components/AuthDialog";
import JoinPage from "./components/JoinPage";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {

  const {setApi, closeApi, setIsClientConnected, setProfile, pokeHeartbeat, pokeRequestVersion, putMessageStoreMap, setMessageStoreMap, localFwdAllPeerRequests, setActivitySetting, peerMap, putPeerMap, localServices, setLocalServices } = useDartStore();

  const [versionOutdated, setVersionOutdated] = useState(false);

  useEffect(() => {
    let reconnectInterval: ReturnType<typeof setInterval> | null = null;

    const connectToKinode = () => {
      const newApi = new KinodeClientApi({
        uri: WEBSOCKET_URL,
        nodeId: window.our?.node,
        processId: PROCESS_NAME,
        onOpen: (event, api) => {
          console.log("Connected to Kinode");
          setIsClientConnected(true);
          localFwdAllPeerRequests();
          if (reconnectInterval) {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
          }
          setInterval(() => {
            pokeHeartbeat();
          }, 30000);
          pokeRequestVersion();
        },
        onMessage: (json, api) => {
          const data = JSON.parse(json)

          if (data["LocalServiceList"]) {
            let localServiceList = data["LocalServiceList"];
            let parsedServices = [];
            for (let jsonService of localServiceList) {
              let service = serviceFromJson(jsonService);
              parsedServices.push(service);
            }
            setLocalServices(parsedServices);
          } else if (data["LocalUser"]) {
            let [profile, activity, activity_setting] = data["LocalUser"]
            setProfile(profileFromJson(profile))
            setActivitySetting(activity_setting);
          } else if (data["PeerList"]) {
            let peerList = data["PeerList"]
            for (let jsonPeer of peerList) {
              let peer = peerFromJson(jsonPeer);
              putPeerMap(peer)
            }
            // console.log("parsed peers", parsedPeers)
          } else if (data["Peer"]){
              let peer = peerFromJson(data["Peer"]);
              putPeerMap(peer)
          } else if (data["LocalService"]) {
            const localService = serviceFromJson(data["LocalService"]);
            // Check if there is a service with service.id in localServices
            // If so, overwrite it with localService. Otherwise, add localService as a new service.
            const existingServices = localServices;
            const index = existingServices.findIndex(s => s.id === localService.id);
            if (index !== -1) {
              // Service exists, replace it
              existingServices[index] = localService;
              setLocalServices([...existingServices]);
            } else {
              // Service doesn't exist, add it
              setLocalServices([...existingServices, localService]);
            }
          } else if (data["MessageStoreList"]) {
            const newMessageStoreMap = new Map<string, MessageStore>();
            for (const messageStore of data["MessageStoreList"]) {
              newMessageStoreMap.set(messageStore.peer_node, messageStore);
            }
            setMessageStoreMap(newMessageStoreMap);
          } else if (data["MessageStore"]) {
            putMessageStoreMap(data["MessageStore"])
          } else if (data["RequestVersionResponse"]) {
            let [node, version] = data["RequestVersionResponse"]
            if (version !== "v0.3.1") {
              setVersionOutdated(true);
            }
          } else {
            console.log("unhandled update", data)
          }
        },
        onError: (event) => {
          console.log("Kinode connection error", event);
          setIsClientConnected(false);
          if (!reconnectInterval) {
            reconnectInterval = setInterval(connectToKinode, 5000);
          }
        },
        onClose: (event) => {
          console.log("Disconnected from Kinode");
          setIsClientConnected(false);
          if (!reconnectInterval) {
            reconnectInterval = setInterval(connectToKinode, 5000);
          }
        },
      });
      setApi(newApi);
    };

    connectToKinode();

    return () => {
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
      }
    };
  }, []);

  return (
    <div style={{
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      position: 'relative', // Add this to allow absolute positioning of the overlay
    }}>
      {/* <div
        style={{
          flexShrink: 0,
        }}
      >
        <ControlHeader />
      </div> */}
      <div
        style={{
          flexGrow: 1,
          height:"100%",
          maxHeight:"100%",
          overflow:"hidden",
        }}
      >
          <Middle />
      </div>
      {versionOutdated && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#242424',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            margin:"1rem",
            display:"flex",
            flexDirection:"column",
            gap:"0.5rem",
          }}>
            <div>a new version of dartfrog is available in the kinode app store.</div>
            <div
              style={{

                fontSize:"0.8rem",
                color:"gray",
              }}
            >
              your version is incompatible with others until you upgrade.
              if you have any issues, contact a.cow on discord
            </div>
            {/* <button
              onClick={()=>{
                setVersionOutdated(false);
              }}
              style={{
                margin:"1rem",
                marginBottom:"0rem",
                padding:"0.5rem 1rem",
                width:"auto",
                height:"auto",
              }}
            >
              dismiss
            </button> */}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;