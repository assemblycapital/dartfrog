import KinodeClientApi from "@kinode/client-api";
import "./App.css";
import Footer from "./components/Footer";
import ControlHeader from "./components/ControlHeader";
import { useEffect, useRef, useState } from "react";
import { PROCESS_NAME, WEBSOCKET_URL, } from './utils';
import { Service, ServiceConnectionStatusType, peerFromJson, profileFromJson, serviceFromJson, } from "@dartfrog/puddle";
import useDartStore, { CHAT_PLUGIN, CHESS_PLUGIN, INBOX_PLUGIN, PAGE_PLUGIN, PIANO_PLUGIN } from "./store/dart";
import BrowserBox from "./components/BrowserBox";
import TabbedWindowManager from "./components/TabbedWindowManager";
import Sidebar from "./components/Sidebar/Sidebar";
import Middle from "./components/Middle";
import AuthDialog from "./components/AuthDialog";
import JoinPage from "./components/JoinPage";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {

  const {setApi, closeApi, setIsClientConnected, setProfile, localFwdAllPeerRequests, setActivitySetting, peerMap, putPeerMap, localServices, setLocalServices } = useDartStore();

  useEffect(() => {
    const newApi = new KinodeClientApi({
      uri: WEBSOCKET_URL,
      nodeId: window.our?.node,
      processId: PROCESS_NAME,
      onOpen: (event, api) => {
        console.log("Connected to Kinode");
        setIsClientConnected(true);
        localFwdAllPeerRequests();
        // api.send({data:{
        //   "CreateService": ["foo", "bar:baz:bop.os"]

        // }})
        // this.onOpen();
        // this.setConnectionStatus(ConnectionStatusType.Connected);
        // if (this.reconnectIntervalId) {
        //   clearInterval(this.reconnectIntervalId);
        //   this.reconnectIntervalId = undefined;
        // }
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
        } else {
          console.log("unhandled update", data)
        }
        // this.setConnectionStatus(ConnectionStatusType.Connected);
        // this.updateHandler(json);
      },
      onError: (event) => {
        console.log("Kinode connection error", event);
      },
      onClose: (event) => {
        console.log("Disconnected from Kinode");
        setIsClientConnected(false);
        // this.setConnectionStatus(ConnectionStatusType.Disconnected);
        // this.onClose();
        // // Set a timeout to attempt reconnection
        // setTimeout(() => {
        //   this.initialize(our, websocket_url);
        // }, 5000); // Retry every 5 seconds
      },
    });
    setApi(newApi);

  }, []);

  return (
    <div style={{
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
    }}>
      <div
        style={{
          flexShrink: 0,
        }}
      >
        <ControlHeader />
      </div>
      <div
        style={{
          flexGrow: 1,
        }}
      >
          <Middle />
      </div>
    </div>
  );
}

export default App;