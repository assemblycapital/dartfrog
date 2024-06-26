import { useCallback, useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./App.css";
import DartApi, { parseServiceId } from "@dartfrog/puddle";
import { WEBSOCKET_URL, maybePlaySoundEffect } from "./utils";
import usePageStore, { PLUGIN_NAME } from "./store/page";
import PagePluginBox from "./components/PagePluginBox";

function App() {
  const location = useLocation();
  const {api, setApi, serviceId, setServiceId, page, setPage} = usePageStore();

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
            // console.log("page pluginUpdate", pluginUpdate);
            if (pluginUpdate["Page"]) {
              setPage(pluginUpdate["Page"]);
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
      {page !== null ? (
        <PagePluginBox serviceId={serviceId} page={page} />
      ) : (
        <p>loading...</p>
      )}
    </div>
  );
}

export default App;
