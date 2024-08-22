
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NoServiceView from "@dartfrog/puddle/components/NoServiceView";
import { PROCESS_NAME, WEBSOCKET_URL } from "./utils";
import useRadioStore from "./store/radio";
import HalfChat from "@dartfrog/puddle/components/HalfChat";
import RadioPluginBox from "./components/RadioPluginBox";
import { useCallback } from "react";
import Home from "./components/Home";
import ServiceView from "@dartfrog/puddle/components/ServiceView";
import RadioHalfChat from "./components/RadioHalfChat";


function App() {

  const {setPlayingMedia, playingMedia, setPlayingMediaTime} = useRadioStore();

  const onServiceMessage = (msg: any) => {
    if (msg.Radio) {
      if (msg.Radio.StationState) {
        let [newPlaying, newMediaStore] = msg.Radio.StationState;
        setPlayingMedia(newPlaying);
      } else if (msg.Radio.PlayMedia) {
        setPlayingMedia(msg.Radio.PlayMedia);
      } else if (msg.Radio.PlayMediaStartTime) {
        setPlayingMediaTime(msg.Radio.PlayMediaStartTime)
      } else {
        console.log("unhandled update", msg.Radio)
      }
    }
  };

  return (
    <Router basename={`/${PROCESS_NAME}`}>
      <Routes>
        <Route path="/*" element={
          <Home />
        }
        />
        <Route path="/df" element={
          <NoServiceView processName={PROCESS_NAME} websocketUrl={WEBSOCKET_URL} ourNode={window.our?.node} />
        } />
        <Route path="/df/service/:id" element={
          <ServiceView
            ourNode={window.our.node}
            processName={PROCESS_NAME}
            websocketUrl={WEBSOCKET_URL}
            onServiceMessage={onServiceMessage}
            Element={RadioHalfChat}
            fullscreen
           />
        } />
      </Routes>
    </Router>
  );
}

export default App;
