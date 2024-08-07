import "@dartfrog/puddle/components/App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ServiceView from "./components/ServiceView";
import NoServiceView from "@dartfrog/puddle/components/NoServiceView";
import { WEBSOCKET_URL } from "./utils";

export const PROCESS_NAME = "chat:dartfrog:herobrine.os"

function App() {

  return (
    <Router basename={`/${PROCESS_NAME}`}>
      <Routes>
        <Route path="/" element={
          <NoServiceView processName={PROCESS_NAME} websocketUrl={WEBSOCKET_URL} ourNode={window.our?.node} />
        } />
        <Route path="/df/service/:id" element={
          <ServiceView />
        } />
      </Routes>
    </Router>
  );
}

export default App;
