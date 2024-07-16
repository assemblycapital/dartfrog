import { useCallback, useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./App.css";
import { ServiceApi }from "@dartfrog/puddle";
import { WEBSOCKET_URL, maybePlaySoundEffect, maybePlayTTS } from "./utils";
import useChatStore, { PLUGIN_NAME } from "./store/chat";
import ChatBox from "./components/ChatBox";
import ChatInput from "./components/ChatInput";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NoServiceView from "./components/NoServiceView";
import ServiceView from "./components/ServiceView";

export const PROCESS_NAME = "chat:dartfrog:herobrine.os"

function App() {

  return (
    <Router basename={`/${PROCESS_NAME}`}>
      <Routes>
        <Route path="/" element={
          <NoServiceView />
        } />
        <Route path="/df/service/:id" element={
          <ServiceView />
        } />
      </Routes>
    </Router>
  );
}

export default App;
