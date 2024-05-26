import { useState, useEffect, useCallback, useRef, Fragment} from "react";
import KinodeClientApi from "@kinode/client-api";
import {acap_ascii} from "./asciiArt";
import "./App.css";
import { Hash } from "crypto";

const BASE_URL = import.meta.env.BASE_URL;
if (window.our) window.our.process = BASE_URL?.replace("/", "");

const PROXY_TARGET = `${(import.meta.env.VITE_NODE_URL || "http://localhost:8080")}${BASE_URL}`;

// This env also has BASE_URL which should match the process + package name
const WEBSOCKET_URL = import.meta.env.DEV
  ? `${PROXY_TARGET.replace('http', 'ws')}`
  : undefined;

type ChatMessage = {
  time: number;
  from: string;
  msg: string;
}

function App() {
  const [nodeConnected, setNodeConnected] = useState(false);
  const [api, setApi] = useState<KinodeClientApi | undefined>();

  const [chatMessageHistory, setChatMessageHistory] = useState<Array<ChatMessage>>([]);
  const addMessage = (newMessage: ChatMessage) => {
    setChatMessageHistory(prevMessages => [...prevMessages, newMessage]);
  };

  const [chatMessageInputText, setChatMessageInputText] = useState("");
  const handleInputChange = (event) => {
    setChatMessageInputText(event.target.value);
  };

  const messagesEndRef = useRef(null);


  const [nameColors, setNameColors] = useState({});


  const getNameColor = useCallback((name) => {
    if (nameColors[name]) {
      // Return the cached color if it exists
      return nameColors[name];
    } else {
      // Calculate the color and update the state
      const newColor = computeColorForName(name);
      setNameColors((prevColors) => ({
        ...prevColors,
        [name]: newColor,
      }));
      return newColor;
    }
  }, [nameColors]);


  useEffect(() => {
    // Connect to the Kinode via websocket
    // console.log('WEBSOCKET URL', WEBSOCKET_URL)
    if (window.our?.node && window.our?.process) {
      console.log(window.our.node, window.our.process);
      const api = new KinodeClientApi({
        uri: WEBSOCKET_URL,
        nodeId: window.our.node,
        processId: window.our.process,
        onClose: (_event) => {
          console.log("Disconnected from Kinode");
          setNodeConnected(false);
        },
        onOpen: (_event, _api) => {
          console.log("Connected to Kinode");
          setNodeConnected(true);
          // api.send({ data: "Hello World" });
        },
        onMessage: (json, _api) => {
          // console.log('WEBSOCKET MESSAGE', json)
          try {
            const data = JSON.parse(json);
            const [messageType] = Object.keys(data);
            if (!messageType) return;

            if (messageType !== "WsDartUpdate") {
              return
            }
            let upd = data.WsDartUpdate;
            if (upd["NewChat"]) {
              let msg = upd["NewChat"];
              let chat : ChatMessage = {
                time: msg['time'],
                from: msg['from'],
                msg: msg['msg']
              }
              
              addMessage(chat);
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
  useEffect(() => {
    scrollDownChat();
  }, [chatMessageHistory]);

  const scrollDownChat = useCallback(
    async () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesEndRef]);

  const sendDart = useCallback(
    async (event) => {
      event.preventDefault();

      if (!api) return;
      if (!chatMessageInputText) return;

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
        setChatMessageInputText("");

        // Add the message if the POST request was successful
      } catch (error) {
        console.error(error);
      }
    },
    [api, chatMessageInputText]
  );

  
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#ffffff88",
        }}
      >
        <span style={{fontFamily:"monospace", flexGrow: 1}}>
          {/* {window.our.node}@{window.our.process} */}
          {time.toLocaleString()}
        </span>
        <div>
          {nodeConnected ? 'connected': 'connecting...'}
        </div>
      </div>
      <div
        style={{
          height: "400px",
          maxHeight: "400px",
          overflow: "scroll",
          backgroundColor: "#202020",
          margin: "10px 0px",
          alignContent: "flex-end",
        }}
      >
        <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          backgroundColor: "#242424",
        }}
        >
          {chatMessageHistory.map((message, index) => (
            <div key={index} style={{
              wordWrap: "break-word",
            }}>
              <div style={{color:"#ffffff77", fontSize: "0.8rem", display: "inline-block", marginRight:"5px", cursor: "default"}}>
                <span>{formatTimestamp(message.time)}</span>
              </div>
              <div style={{color: getNameColor(message.msg), display: "inline-block", marginRight:"5px"}}>
                <span>{message.from}:</span>
              </div>
                <span>{message.msg}</span>
            </ div>
            ))}
          <div ref={messagesEndRef} 
            style={{display:"inline"}}
          />
        </div>
      </div>
      <div
        style={{display: "flex", flexDirection: "row"}}
      >
        <textarea
          style={{
            flexGrow: 1,
          }}
          value={chatMessageInputText}
          onChange={handleInputChange}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();  // Prevents the default behavior of creating a new line
              sendDart(event);
            }
          }}
        />
        <button style={{cursor:"pointer"}} onClick={sendDart}>Send</button>
      </div>
      <div style={{marginTop:"12px", color: "#ffffff77"}}>
      <div>
          <span>7 online: </span>
      </div>
      <div>
          <span>6 recently online: </span>
      </div>
      <div>
          <span>30 others: </span>
      </div>
      </div>
    </div>
  );
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000); // convert from seconds to milliseconds
  const day = date.toLocaleDateString('en-US', { weekday: 'short' });
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${day} ${time}`;
}



function computeColorForName(name: string): string {
  let hash: number = Math.abs(simpleHash(name));
  let color: string;

  let numColors = 5;
  switch (hash % numColors) {
    case 0:
      // red
      color = '#cc4444';
      break;
    case 1:
      // blue
      color = '#339933';
      break;
    case 2:
      // green
      color = '#4682B4';
      break;
    case 3:
      // orange
      color = '#cc7a00';
      break;
    case 4:
      // purple
      color = '#a36bdb';
      break;
    default:
      color= '#ffffff';
      break;
  }

  return color;
}

function simpleHash(source: string): number {
  let hash = 0;

  for (let i = 0; i < source.length; i++) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return hash;
}


export default App;
