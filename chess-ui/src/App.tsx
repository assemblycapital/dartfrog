import { useCallback, useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./App.css";
// import DartApi from "@dartfrog/puddle";
import { WEBSOCKET_URL } from "./utils";
import useChessStore, { PLUGIN_NAME, handleChessUpdate } from "./store/chess";
import ChessPluginBox from "./components/ChessPluginBox";

function App() {
  const location = useLocation();
  const {api, setApi, serviceId, setServiceId, chessState, setChessState} = useChessStore();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const paramService = searchParams.get("service");

    if (paramService) {
      setServiceId(paramService);
    } else {
      setServiceId(null);
    }

  }, [location.search])

  useEffect(() => {
    if (!serviceId) {
      return;
    }

  }, [serviceId]);


  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
      {serviceId ? (
        <>
        {chessState ? (
          <ChessPluginBox chessState={chessState} />
        ) : (
          <p>loading chess state...</p>
        )}
        </>
      ) : (
        <p>No serviceId</p>
      )}
    </div>
  );
}

export default App;
