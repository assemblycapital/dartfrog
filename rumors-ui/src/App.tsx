
import "@dartfrog/puddle/components/App.css";
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NoServiceView from "@dartfrog/puddle/components/NoServiceView";
import { PROCESS_NAME, WEBSOCKET_URL } from "./utils";
import HalfChat from "@dartfrog/puddle/components/HalfChat";
import RumorsBox from "./components/RumorsBox";
import ServiceView from "@dartfrog/puddle/components/ServiceView";


function App() {

  const onServiceMessage = (msg) => {
    if (msg.Rumors) {
    }
  };

  return (
    <Router basename={`/${PROCESS_NAME}`}>
      <Routes>
        <Route path="/" element={
          <NoServiceView processName={PROCESS_NAME} websocketUrl={WEBSOCKET_URL} ourNode={window.our?.node} />
        } />
        <Route path="/df/service/:id" element={
          <ServiceView
            ourNode={window.our.node}
            Element={RumorsBox}
            processName={PROCESS_NAME}
            websocketUrl={WEBSOCKET_URL}
            onServiceMessage={onServiceMessage}
            enableChatSounds
           />
        } />
      </Routes>
    </Router>
  );
}

export default App;
