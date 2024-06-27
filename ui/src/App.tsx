import "./App.css";
import Footer from "./components/Footer";
import ControlHeader from "./components/ControlHeader";
import { useEffect, useRef, useState } from "react";
import { WEBSOCKET_URL, } from './utils';
import DartApi from "@dartfrog/puddle";
import useDartStore from "./store/dart";
import BrowserBox from "./components/BrowserBox";
import TabbedWindowManager from "./components/TabbedWindowManager";
import Sidebar from "./components/Sidebar/Sidebar";
import Middle from "./components/Middle";

function App() {

  const {setApi, closeApi, handleUpdate, setIsClientConnected, setServices, services, setAvailableServices, requestServiceList, availableServices, } = useDartStore();


  useEffect(() => {
    const api = new DartApi({
      our: window.our,
      websocket_url: WEBSOCKET_URL,
      onOpen: () => {
        setIsClientConnected(true);
        requestServiceList(window.our.node);
        setServices(new Map());
      },
      onClose: () => {
        setIsClientConnected(false);
      },
      onServicesChangeHook: (services) => {
        // console.log("servicesChange", services);
        setServices(services);
      },
      onAvailableServicesChangeHook: (availableServices) => {
        // console.log("availableServices", availableServices);
        setAvailableServices(availableServices);
      }
    });
    setApi(api);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        // pokeUnsubscribe();
        // api.close();
        closeApi();
    };
  
    window.addEventListener('beforeunload', handleBeforeUnload);
  
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div style={{
      height: '100vh',
      maxHeight: '100vh',
      overflowY: 'hidden',
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
