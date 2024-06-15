import "./App.css";
import Footer from "./components/Footer";
import ControlHeader from "./components/ControlHeader";
import { useEffect, useRef, useState } from "react";
import { ConnectionStatusType } from "./types/types";
import ServerBox from "./components/FullServicesView";
import { WEBSOCKET_URL, } from './utils';
import KinodeClientApi from "@kinode/client-api";
import DartApi from "./dartclientlib/";
import useDartStore from "./store/dart";
import FullServicesView from "./components/FullServicesView";
import BrowserBox from "./components/BrowserBox";
import { availableParallelism } from "os";

function App() {

  const {setApi, closeApi, handleUpdate, setIsClientConnected, setServices, setAvailableServices, availableServices} = useDartStore();


  useEffect(() => {
    const api = new DartApi({
      serviceUpdateHandlers: new Map(),
      onOpen: () => {
        setIsClientConnected(true);
      },
      onClose: () => {
        setIsClientConnected(false);
      },
      onServicesChangeHook: (services) => {
        setServices(services);
      },
      onAvailableServicesChangeHook: (availableServices) => {
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
  
  // useEffect(() => {
  //   // when the user presses a key a-z, focus #chat-input
  //   const handleKeyDown = (event: KeyboardEvent) => {
  //     if (event.key.match(/[a-z]/i)) {
  //       const chatInput = document.getElementById('chat-input');
  //       if (chatInput) {
  //         chatInput.focus();
  //       }
  //     }
  //   };

  //   document.addEventListener('keydown', handleKeyDown);

  //   return () => {
  //     document.removeEventListener('keydown', handleKeyDown);
  //   };
  // }, []);

  return (
    <div style={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "0.4rem",
    }}>
      <ControlHeader />

      <BrowserBox />
      {/* <FullServicesView /> */}

      <Footer />
    </div>
  );
}


export default App;
