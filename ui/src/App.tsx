import { useState, useEffect, useCallback, useRef } from "react";
import KinodeClientApi from "@kinode/client-api";
import "./App.css";

const BASE_URL = import.meta.env.BASE_URL;
if (window.our) window.our.process = BASE_URL?.replace("/", "");

const PROXY_TARGET = `${(import.meta.env.VITE_NODE_URL || "http://localhost:8080")}${BASE_URL}`;

// This env also has BASE_URL which should match the process + package name
const WEBSOCKET_URL = import.meta.env.DEV
  ? `${PROXY_TARGET.replace('http', 'ws')}`
  : undefined;

function App() {
  const [nodeConnected, setNodeConnected] = useState(true);
  const [api, setApi] = useState<KinodeClientApi | undefined>();
  const [chatMessageInputText, setChatMessageInputText] = useState("");
  const handleInputChange = (event) => {
    setChatMessageInputText(event.target.value);
  };


  useEffect(() => {
    // Connect to the Kinode via websocket
    // console.log('WEBSOCKET URL', WEBSOCKET_URL)
    if (window.our?.node && window.our?.process) {
      console.log(window.our.node, window.our.process);
      const api = new KinodeClientApi({
        uri: WEBSOCKET_URL,
        nodeId: window.our.node,
        processId: window.our.process,
        onOpen: (_event, _api) => {
          console.log("Connected to Kinode");
          // api.send({ data: "Hello World" });
        },
        onMessage: (json, _api) => {
          // console.log('WEBSOCKET MESSAGE', json)
          try {
            const data = JSON.parse(json);
            const [messageType] = Object.keys(data);
            if (!messageType) return;

            if (messageType === "WsDartUpdate") {
              console.log(data.WsDartUpdate)
            }
          } catch (error) {
            console.error("Error parsing WebSocket message", error);
          }
        },
        onError: (ev) => {
          console.log("kinode connection error", ev);
        },
      });

      setApi(api);
    } else {
      setNodeConnected(false);
    }
  }, []);

  const sendDart = useCallback(
    async (event) => {
      event.preventDefault();

      if (!api) return;

      // Create a message object
      const data = {"ClientRequest": {"SendToServer": {"ChatMessage": chatMessageInputText}}};
      const body = JSON.stringify(data);
      console.log("sending post body", body)

      // Send a message to the node via websocket
      // UNCOMMENT THE FOLLOWING 2 LINES to send message via websocket
      // api.send({ data });
      // setMessage("");

      // Send a message to the node via HTTP request
      // IF YOU UNCOMMENTED THE LINES ABOVE, COMMENT OUT THIS try/catch BLOCK
      try {
        const result = await fetch(`${BASE_URL}/api`, {
          method: "POST",
          body: JSON.stringify(data),
        });

        if (!result.ok) throw new Error("HTTP request failed");

        // Add the message if the POST request was successful
      } catch (error) {
        console.error(error);
      }
    },
    [api, chatMessageInputText]
  );

  return (
    <div style={{ width: "100%" }}>
        <h1>dartfrog</h1>
        <p></p>
        <div>
        <input
          type="text"
          value={chatMessageInputText}
          onChange={handleInputChange}
        />
        <button onClick={sendDart}>Send</button>
        </div>

    </div>
  );
}

export default App;
