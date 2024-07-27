import "@dartfrog/puddle/components/App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NoServiceView from "@dartfrog/puddle/components/NoServiceView";
import HalfChat from "@dartfrog/puddle/components/HalfChat";
import { PROCESS_NAME, WEBSOCKET_URL } from "./utils";
import Piano from "./components/Piano/Piano";
import usePianoStore from "./store/piano";


function App() {

  const {pianoState, setPianoState} = usePianoStore();
  const onServiceMessage = (msg: any) => {
    if (msg.Piano) {
      if (msg.Piano.PlayNote) {
        let [player, note] = msg.Piano.PlayNote;
        setPianoState({
          notePlayed: {
            note,
            player,
            timestamp: Date.now(),
          }
        });
      }
    }
  }

  return (
    <Router basename={`/${PROCESS_NAME}`}>
      <Routes>
        <Route path="/" element={
          <NoServiceView processName={PROCESS_NAME} websocketUrl={WEBSOCKET_URL} ourNode={window.our?.node} />
        } />
        <Route path="/df/service/:id" element={
          <HalfChat
            ourNode={window.our.node}
            Element={Piano}
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
