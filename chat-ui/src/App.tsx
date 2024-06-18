import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./App.css";
import DartApi from "@dartfrog/puddle";
import { WEBSOCKET_URL } from "./utils";

function App() {
  const location = useLocation();

  const [service, setService] = useState<String | null>(null);

  useEffect(() => {

    const searchParams = new URLSearchParams(location.search);
    const service = searchParams.get("service");

    if (service) {
      setService(service);
    } else {
      setService(null);
    }

  }, [location.search])

  useEffect(() => {
    const api = new DartApi({
      our: window.our,
      websocket_url: WEBSOCKET_URL,
      serviceUpdateHandlers: new Map(),
      onOpen: () => {
        console.log("connected")
      },
      onClose: () => {
      },
      onServicesChangeHook: (services) => {
        console.log("got services", services)
      },
      onAvailableServicesChangeHook: (availableServices) => {
      }
    });
  }, []);

  return (
    <div style={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "0.4rem",
    }}>
      <div>
        todo chat ui
        <div>

        {"service: "}
        {service && service}
        </div>
      </div>
    </div>
  );
}

export default App;
