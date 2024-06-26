import { useCallback, useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import Piano, { PianoState } from "./components/Piano/Piano";
import "./App.css";
import DartApi, { parseServiceId } from "@dartfrog/puddle";
import { WEBSOCKET_URL, maybePlaySoundEffect } from "./utils";
import usePianoStore, { PLUGIN_NAME } from "./store/piano";

function App() {
  const location = useLocation();
  const {api, setApi, serviceId, setServiceId} = usePianoStore();
  const [pianoState, setPianoState] = useState<PianoState>(null);

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
            if (pluginUpdate["PlayNote"]) {
              
              const note = pluginUpdate["PlayNote"];
              const newPianoState: PianoState = {
                notePlayed: {
                  note: note[1],
                  player: note[0],
                  timestamp: Date.now(),
                },
              };
              setPianoState(newPianoState);

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
      <Piano serviceId={serviceId} pianoState={pianoState} />
    </div>
  );
}

export default App;
