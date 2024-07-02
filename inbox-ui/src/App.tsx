import { useCallback, useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./App.css";
import DartApi, { parseServiceId } from "@dartfrog/puddle";
import { WEBSOCKET_URL } from "./utils";
import useInboxStore, { PLUGIN_NAME } from "./store/inbox";
import InboxApp from "./components/InboxApp";

function App() {
  const location = useLocation();
  const {api, setApi, serviceId, setServiceId, inboxService, setInboxService, setInboxFromUpdate} = useInboxStore();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const paramService = searchParams.get("service");

    if (paramService) {
      setServiceId(paramService);
    } else {
      setServiceId(null);
    }

  }, [location.search])

  useEffect(() => {
    if (!serviceId) {
      return;
    }
    const api = new DartApi({
      our: window.our,
      websocket_url: WEBSOCKET_URL,
      pluginUpdateHandler: {
          plugin:PLUGIN_NAME,
          serviceId,
          handler:(pluginUpdate, service, source) => {
            if (pluginUpdate["Inbox"]) {
              let [user, inbox] = pluginUpdate["Inbox"];
              setInboxFromUpdate(user, inbox);


            } else if (pluginUpdate["AllInboxes"]) {
              let allInboxes = pluginUpdate["AllInboxes"]

              let allInboxesMap = new Map();
              for (let i = 0; i < allInboxes.length; i++) {
                let [key, value] = allInboxes[i];
                allInboxesMap.set(key, value);
              }
              setInboxService({ inboxes: allInboxesMap });
            }
          }
        },
      onOpen: () => {
        api.joinService(serviceId);
        setApi(api);
      },
      onClose: () => {
      },
    });

  }, [serviceId]);


  return (
    <div style={{
      display: 'flex',
      height: '100%',
      width: '100%',
    }}>
      {inboxService !== null ? (
        <InboxApp inboxService={inboxService} />
      ) : (
        <p>loading...</p>
      )}
    </div>
  );
}

export default App;
