import KinodeClientApi from "@kinode/client-api";
import "./App.css";
import Footer from "./components/Footer";
import ControlHeader from "./components/ControlHeader";
import { useEffect, useRef, useState } from "react";
import { PROCESS_NAME, WEBSOCKET_URL, } from './utils';
import DartApi from "@dartfrog/puddle";
import useDartStore, { CHAT_PLUGIN, CHESS_PLUGIN, INBOX_PLUGIN, PAGE_PLUGIN, PIANO_PLUGIN } from "./store/dart";
import BrowserBox from "./components/BrowserBox";
import TabbedWindowManager from "./components/TabbedWindowManager";
import Sidebar from "./components/Sidebar/Sidebar";
import Middle from "./components/Middle";
import AuthDialog from "./components/AuthDialog";
import JoinPage from "./components/JoinPage";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {

  const {setApi, closeApi, setIsClientConnected } = useDartStore();

  useEffect(() => {
    console.log("setting api", window.our?.node, PROCESS_NAME)
    const newApi = new KinodeClientApi({
      uri: WEBSOCKET_URL,
      nodeId: window.our?.node,
      processId: PROCESS_NAME,
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
      onOpen: (event, api) => {
        console.log("Connected to Kinode");
        setIsClientConnected(true);
        // this.onOpen();
        // this.setConnectionStatus(ConnectionStatusType.Connected);
        // if (this.reconnectIntervalId) {
        //   clearInterval(this.reconnectIntervalId);
        //   this.reconnectIntervalId = undefined;
        // }
      },
      onMessage: (json, api) => {
        console.log("update", json)
        // this.setConnectionStatus(ConnectionStatusType.Connected);
        // this.updateHandler(json);
      },
      onError: (event) => {
        console.log("Kinode connection error", event);
      },
    });

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
      <Routes>
        <Route path="/" element={
            <>
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
            </>
        } />
        <Route path="/join/:id" element={<JoinPage />} />
      </Routes>
    </div>
  );
}

export default App;