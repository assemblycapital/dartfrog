import "@dartfrog/puddle/components/App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NoServiceView from "@dartfrog/puddle/components/NoServiceView";
import ServiceView from "./components/ServiceView";
import { PROCESS_NAME, WEBSOCKET_URL } from "./utils";


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
