import "./App.css";
import { BrowserRouter as Router, Route, Routes, useParams } from "react-router-dom";
import { NoServiceView, HalfChat } from '@dartfrog/puddle';
import { PROCESS_NAME, WEBSOCKET_URL } from "./utils";
import useChessStore, { handleChessUpdate } from "./store/chess";
import ChessPluginBox from "./components/ChessPluginBox";

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
  const { setChessState, chessState } = useChessStore();

  const onServiceMessage = (msg: any) => {
    if (msg.Chess) {
      let newChessState = handleChessUpdate(chessState, msg.Chess);
      setChessState(newChessState);
    }
  };

  return (
    <HalfChat
      ourNode={window.our.node}
      Element={ChessPluginBox}
      processName={PROCESS_NAME}
      websocketUrl={WEBSOCKET_URL}
      onServiceMessage={onServiceMessage}
      enableChatSounds
      paramServiceId={id}
    />
  );
}

export default App;
