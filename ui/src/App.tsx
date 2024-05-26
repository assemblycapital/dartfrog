import { useState, useEffect, useCallback, useRef, Fragment} from "react";
import KinodeClientApi from "@kinode/client-api";
import {frog_ascii} from "./frog";
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
  const [nodeConnected, setNodeConnected] = useState(true);
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
      <p style={{fontFamily:"monospace"}}>
        {/* {window.our.node}@{window.our.process} */}
        {time.toLocaleString()}
      </p>
      <div
        style={{
          height: "400px",
          maxHeight: "400px",
          overflow: "scroll",
          backgroundColor: "#202020",
          marginBottom: "4px",
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
              // display: "flex",
              // flexDirection: "row",
              // gap: "5px",
              // overflowX: "scroll",
              wordWrap: "break-word",
            }}>
              <div style={{color:"#ffffffaa", display: "inline-block", marginRight:"5px"}} >
                <span>{formatTimestamp(message.time)}</span>
              </div>
              <div style={{color: getColorForName(message.from), display: "inline-block", marginRight:"5px"}}>
                <span>{message.from}:</span>
              </div>
              {/* <div> */}
                <span>{message.msg}</span>
              {/* </div> */}
            </ div>
            ))}
          <div ref={messagesEndRef} 
            style={{display:"inline"}}
          />
        </div>
      </div>
      <hr style={{
        border: "1px solid #ffffff44",

      }} />
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
        <button onClick={sendDart}>Send</button>
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

function getColorForName(name: string): string {
  let hash: number = simpleHash(name);
  let color: string;

  if (hash % 3 === 0) {
    color = '#ff8080';
  } else if (hash % 3 === 1) {
    color = '#66ffb3';
  } else if (hash % 3 === 2) {
    color = '#4682B4';
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
