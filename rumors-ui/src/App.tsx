import "./App.css";
import "./puddle.css";
import { BrowserRouter as Router, Route, Routes, useParams } from "react-router-dom";
import { NoServiceView, ServiceView } from '@dartfrog/puddle';
import { PROCESS_NAME, WEBSOCKET_URL } from "./utils";
import useRumorsStore from "./store/rumors";
import RumorsBox from "./components/RumorsBox";

function App() {
  return (
    <Router basename={`/${PROCESS_NAME}`}>
      <Routes>
        <Route path="/" element={
          <NoServiceView processName={PROCESS_NAME} websocketUrl={WEBSOCKET_URL} ourNode={window.our?.node} />
        } />
        <Route path="/df/service/:id/*" element={<ServiceRoute />} />
      </Routes>
    </Router>
  );
}

function ServiceRoute() {
  const { id } = useParams();

  const { handleUpdate } = useRumorsStore();

  const onServiceMessage = (msg) => {
    if (msg.Rumors) {
      handleUpdate(msg.Rumors)
    }
  };

  return (
    <ServiceView
      ourNode={window.our?.node}
      Element={RumorsBox}
      processName={PROCESS_NAME}
      websocketUrl={WEBSOCKET_URL}
      onServiceMessage={onServiceMessage}
      enableChatSounds
      paramServiceId={id}
      fullscreen
    />
  );
}

export default App;
