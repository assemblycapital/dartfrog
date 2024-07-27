
import "@dartfrog/puddle/components/App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NoServiceView from "@dartfrog/puddle/components/NoServiceView";
import { PROCESS_NAME, WEBSOCKET_URL } from "./utils";
import useRadioStore from "./store/radio";
import HalfChat from "@dartfrog/puddle/components/HalfChat";
import RadioPluginBox from "./components/RadioPluginBox";


function App() {

  const {} = useRadioStore();

  const onServiceMessage = (msg) => {
    if (msg.Radio) {
      console.log("radio message")
    }
  };

  return (
    <Router basename={`/${PROCESS_NAME}`}>
      <Routes>
        <Route path="/" element={
          <NoServiceView processName={PROCESS_NAME} websocketUrl={WEBSOCKET_URL} ourNode={window.our?.node} />
        } />
        <Route path="/df/service/:id" element={
          <HalfChat
            ourNode={window.our.node}
            Element={RadioPluginBox}
            processName={PROCESS_NAME}
            websocketUrl={WEBSOCKET_URL}
            onServiceMessage={onServiceMessage}
           />
        } />
      </Routes>
    </Router>
  );
}

export default App;
