import "@dartfrog/puddle/components/App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NoServiceView from "./components/NoServiceView";
import ServiceView from "./components/ServiceView";

export const PROCESS_NAME = "chat:dartfrog:herobrine.os"

function App() {

  return (
    <Router basename={`/${PROCESS_NAME}`}>
      <Routes>
        <Route path="/" element={
          <NoServiceView />
        } />
        <Route path="/df/service/:id" element={
          <ServiceView />
        } />
      </Routes>
    </Router>
  );
}

export default App;
