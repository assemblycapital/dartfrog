import { useCallback, useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./App.css";
import DartApi, { parseServiceId } from "@dartfrog/puddle";
import { WEBSOCKET_URL, maybePlaySoundEffect } from "./utils";
import useInboxStore, { PLUGIN_NAME } from "./store/inbox";

function App() {
  const location = useLocation();
  const {api, setApi, serviceId, setServiceId, inbox, setInbox} = useInboxStore();

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
            console.log("inbox pluginUpdate", pluginUpdate);
            // if (pluginUpdate["inbox"]) {
            //   setInbox(pluginUpdate["inbox"]);
            // }
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
      {inbox !== null ? (
        <div>
          <h1>TODO Inbox</h1>
        </div>
      ) : (
        <p>loading...</p>
      )}
    </div>
  );
}

export default App;
