
import "@dartfrog/puddle/components/App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NoServiceView from "@dartfrog/puddle/components/NoServiceView";
import { PROCESS_NAME, WEBSOCKET_URL } from "./utils";
import usePageStore from "./store/forum";
import HalfChat from "@dartfrog/puddle/components/HalfChat";
import ServiceView from "@dartfrog/puddle/components/ServiceView";
import Forum from "./components/Forum";
import useForumStore from "./store/forum";
import './App.css'

function App() {

  const {handleUpdate} = useForumStore();

  const onServiceMessage = (msg) => {
    if (msg.Forum) {
      handleUpdate(msg.Forum);
    }
  };

  return (
    <Router basename={`/${PROCESS_NAME}`}>
      <Routes>
        <Route path="/" element={
          <NoServiceView processName={PROCESS_NAME} websocketUrl={WEBSOCKET_URL} ourNode={window.our?.node} />
        } />
        <Route path="/df/service/:id/*" element={
          <ServiceView
            ourNode={window.our.node}
            processName={PROCESS_NAME}
            websocketUrl={WEBSOCKET_URL}
            onServiceMessage={onServiceMessage}
            Element={Forum}
           />
        } />
      </Routes>
    </Router>
  );
}

export default App;
