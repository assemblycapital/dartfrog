import "./App.css";
import "./puddle.css";
import { BrowserRouter as Router, Route, Routes, useParams } from "react-router-dom";
import { NoServiceView, ServiceView } from '@dartfrog/puddle';
import { PROCESS_NAME, WEBSOCKET_URL } from "./utils";
import useRadioStore from "./store/radio";
import RadioPluginBox from "./components/RadioPluginBox";
import Home from "./components/Home";
import RadioHalfChat from "./components/RadioHalfChat";

function App() {
  return (
    <Router basename={`/${PROCESS_NAME}`}>
      <Routes>
        <Route path="/*" element={<Home />} />
        <Route path="/df" element={
          <NoServiceView processName={PROCESS_NAME} websocketUrl={WEBSOCKET_URL} ourNode={window.our?.node} />
        } />
        <Route path="/df/service/:id/*" element={<ServiceRoute />} />
      </Routes>
    </Router>
  );
}

function ServiceRoute() {
  const { id } = useParams();
  const { setPlayingMedia, setPlayingMediaTime } = useRadioStore();

  const onServiceMessage = (msg: any) => {
    if (msg.Radio) {
      if (msg.Radio.StationState) {
        let [newPlaying, newMediaStore] = msg.Radio.StationState;
        setPlayingMedia(newPlaying);
      } else if (msg.Radio.PlayMedia) {
        setPlayingMedia(msg.Radio.PlayMedia);
      } else if (msg.Radio.PlayMediaStartTime) {
        setPlayingMediaTime(msg.Radio.PlayMediaStartTime);
      } else {
        console.log("unhandled update", msg.Radio);
      }
    }
  };

  return (
    <ServiceView
      ourNode={window.our.node}
      Element={RadioHalfChat}
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
