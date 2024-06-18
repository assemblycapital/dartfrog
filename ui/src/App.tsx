import "./App.css";
import Footer from "./components/Footer";
import ControlHeader from "./components/ControlHeader";
import { useEffect, useRef, useState } from "react";
import { WEBSOCKET_URL, } from './utils';
import DartApi from "@dartfrog/puddle";
import useDartStore from "./store/dart";
import BrowserBox from "./components/BrowserBox";
import TabbedWindowManager from "./components/TabbedWindowManager";

function App() {

  const {setApi, closeApi, handleUpdate, setIsClientConnected, setServices, services, setAvailableServices, requestServiceList, availableServices} = useDartStore();


  useEffect(() => {
    const api = new DartApi({
      our: window.our,
      websocket_url: WEBSOCKET_URL,
      serviceUpdateHandlers: new Map(),
      onOpen: () => {
        setIsClientConnected(true);
        requestServiceList(window.our.node);
        setServices(new Map());
      },
      onClose: () => {
        setIsClientConnected(false);
      },
      onServicesChangeHook: (services) => {
        console.log("servicesChange", services);
        setServices(services);
      },
      onAvailableServicesChangeHook: (availableServices) => {
        console.log("availableServices", availableServices);
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
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "0.4rem",
    }}>
      <ControlHeader />

      <TabbedWindowManager services={services} />
      {/* <FullServicesView /> */}

      <Footer />
    </div>
  );
}


export default App;
