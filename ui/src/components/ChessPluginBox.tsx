import React, { useCallback, useEffect } from 'react';
import { ServiceId, parseServiceId } from '../dartclientlib';
import useDartStore from '../store/dart';
import { ChessState } from '../dartclientlib/chess';

interface ChessPluginBoxProps {
  serviceId: ServiceId;
  chessState: ChessState;
}

const ChessPluginBox: React.FC<ChessPluginBoxProps> = ({ serviceId, chessState }) => {
  const { pokeService } = useDartStore();

  
  useEffect(() => {
  console.log("new chessState", chessState)
  }, [chessState]);

  // Function to send requests to the chess service
  const sendChessRequest = useCallback((innerPluginRequest: object) => {
    const request = { PluginRequest: ["chess", JSON.stringify(innerPluginRequest)] };
    let parsedServiceId = parseServiceId(serviceId);
    pokeService(parsedServiceId, request);
  }, [pokeService, serviceId]);

  // Render the chess board state
  const renderChessBoard = () => {
    return (
      <div>
        {chessState.game ? (
          <>
            <p>Current Turn: {chessState.game.isWhiteTurn ? 'White' : 'Black'}</p>
            <p>White Player: {chessState.game.white}</p>
            <p>Black Player: {chessState.game.black}</p>
            <p>Moves: {chessState.game.moves.join(", ")}</p>
          </>
        ) : (
          <p>No game in progress</p>
        )}
      </div>
    );
  };

  // Example usage of sendChessRequest
  // This can be triggered by button click or other event handlers
  // Example: sendChessRequest({ type: "Queue", color: "White" })

  return (
    <div>
      <h2>Chess Game</h2>
      {renderChessBoard()}
      <button onClick={() => sendChessRequest({ "Queue": "White" })}>Queue as White</button>
      <button onClick={() => sendChessRequest({ "Queue": "Black" })}>Queue as Black</button>
      <input
        type="text"
        placeholder="Enter your move (e.g., e2-e4)"
        onKeyDown={e => {
          if (e.key === 'Enter') {
            sendChessRequest({ "Move": e.currentTarget.value });
            e.currentTarget.value = ''; // Clear input after submitting
          }
        }}
      />
    </div>
  );
};

export default ChessPluginBox;
