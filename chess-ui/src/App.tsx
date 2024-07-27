
import "@dartfrog/puddle/components/App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NoServiceView from "@dartfrog/puddle/components/NoServiceView";
import HalfChat from "@dartfrog/puddle/components/HalfChat";
import { PROCESS_NAME, WEBSOCKET_URL } from "./utils";
import ChessPluginBox from "./components/ChessPluginBox";
import useChessStore, { handleChessUpdate } from "./store/chess";

function App() {

  const {setChessState, chessState} = useChessStore();

  const onServiceMessage = (msg: any) => {
    if (msg.Chess) {
      let newChessState = handleChessUpdate(chessState, msg.Chess);
      setChessState(newChessState);
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
            Element={ChessPluginBox}
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
