import "./App.css";
import { BrowserRouter as Router, Route, Routes, useParams } from "react-router-dom";
import { NoServiceView, HalfChat } from '@dartfrog/puddle';
import { PROCESS_NAME, WEBSOCKET_URL } from "./utils";
import usePianoStore from "./store/piano";
import Piano from "./components/Piano/Piano";

function App() {
  return (
    <Router basename={`/${PROCESS_NAME}`}>
      <Routes>
        <Route path="/" element={
          <NoServiceView processName={PROCESS_NAME} websocketUrl={WEBSOCKET_URL} ourNode={window.our?.node} />
        } />
        <Route path="/df/service/:id" element={<ServiceRoute />} />
      </Routes>
    </Router>
  );
}

function ServiceRoute() {
  const { id } = useParams();

  const { setPianoState } = usePianoStore();

  const onServiceMessage = (msg: any) => {
    if (msg.Piano) {
      if (msg.Piano.PlayNote) {
        let playNote = msg.Piano.PlayNote;
        setPianoState({
          notePlayed: {
            note: playNote.note,
            player: playNote.from,
            timestamp: Date.now(),
          }
        });
      }
    }
  };

  return (
    <HalfChat
      ourNode={window.our?.node}
      Element={Piano}
      processName={PROCESS_NAME}
      websocketUrl={WEBSOCKET_URL}
      onServiceMessage={onServiceMessage}
      enableChatSounds
      paramServiceId={id}
    />
  );
}

export default App;
