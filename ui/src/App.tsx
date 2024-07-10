import "./App.css";
import Footer from "./components/Footer";
import ControlHeader from "./components/ControlHeader";
import { useEffect, useRef, useState } from "react";
import { WEBSOCKET_URL, } from './utils';
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

  const {setApi, closeApi, handleUpdate, setIsAuthDialogActive, isAuthDialogActive, authDialog, setAuthDialog, setIsClientConnected, setServices, joinService, setAvailableServices, requestServiceList, availableServices, setHasUnreadInbox} = useDartStore();

  useEffect(() => {
    const inbox_service = `inbox.${window.our?.node}`;
    const api = new DartApi({
      our: window.our,
      websocket_url: WEBSOCKET_URL,
      pluginUpdateHandler: {
          plugin:'inbox:dartfrog:herobrine.os',
          serviceId: inbox_service,
          handler:(pluginUpdate, service, source) => {
            if (pluginUpdate["Inbox"]) {
              let [user, inbox] = pluginUpdate["Inbox"];
              if (inbox.has_unread) {
                setHasUnreadInbox(true);
              }
            } else if (pluginUpdate["AllInboxes"]) {
              let allInboxes = pluginUpdate["AllInboxes"]
              let anyHasUnread = false;
              for (let i = 0; i < allInboxes.length; i++) {
                let [key, value] = allInboxes[i];
                if (value.has_unread) {
                  anyHasUnread = true;
                }
              }
              setHasUnreadInbox(anyHasUnread);
            }
          }
      },
      onOpen: () => {
        setIsClientConnected(true);
        requestServiceList(window.our.node);
        setServices(new Map());
        joinService(inbox_service);
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