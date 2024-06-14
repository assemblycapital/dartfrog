import React, { useCallback, useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import { ServiceId, parseServiceId } from '../dartclientlib';
import useDartStore from '../store/dart';
import { ChessState } from '../dartclientlib/chess';
import Chessboard from 'chessboardjsx';
import { send } from 'process';

interface ChessPluginBoxProps {
  serviceId: ServiceId;
  chessState: ChessState;
}

const ChessPluginBox: React.FC<ChessPluginBoxProps> = ({ serviceId, chessState }) => {
  const { pokeService } = useDartStore();
  const [chess] = useState(new Chess());
  const [gameFen, setGameFen] = useState(chess.fen());

  useEffect(() => {
    if (!chessState.game) return;
    console.log("chessState.game", chessState.game);
    // chess.reset();
    for (let move of chessState.game.moves) {
      try {
        const result = chess.move(move);
        if (result === null) {
        }
      } catch (error) {
      }
    }
    setGameFen(chess.fen());
  }, [chessState, chess]);

  const sendChessRequest = useCallback((req) => {
    let request = { PluginRequest: ["chess", JSON.stringify(req)] };
    let parsedServiceId = parseServiceId(serviceId);
    pokeService(parsedServiceId, request);
  }, [pokeService, serviceId]);

  const onDrop = useCallback((drop) => {
    let res = isMoveValid(drop, chess);
    if (res === null) {
        // invalid move
        return;
    }
    console.log("res", res);
    sendChessRequest({ "Move": res });

  }, [chess, sendChessRequest]);

  function cloneChess(chessInstance) {
    const newChess = new Chess();
    newChess.load(chessInstance.fen());
    return newChess;
  }
  
  function isMoveValid(moveObject, chessInstance) {
    const { sourceSquare, targetSquare, piece } = moveObject;
    const clonedChess = cloneChess(chessInstance);
    try {
      const result = clonedChess.move({
        from: sourceSquare,
        to: targetSquare,
      });
      if (result === null) {
        console.log(`Invalid move attempted: ${sourceSquare} to ${targetSquare}`);
        return null;
      }
      return clonedChess.history()[0];

    } catch (error) {
      console.log(`Invalid move attempted: ${sourceSquare} to ${targetSquare}`);
      return null;
    }
  }
  
    return (
      <div>
        {chessState.game ? (
          <>
            <p>Current Turn: {chessState.game.isWhiteTurn ? 'White' : 'Black'}</p>
            <p>White Player: {chessState.game.white}</p>
            <p>Black Player: {chessState.game.black}</p>
            <p>Moves: {chessState.game.moves.join(", ")}</p>
            <div>
              <Chessboard position={gameFen} 
                width={320}
                // position={position}
                onDrop={onDrop}
              />
            </div>
          </>
        ) : (
        <div>
          <button onClick={() => sendChessRequest({ "Queue": "White" })}>Queue as White</button>
          <button onClick={() => sendChessRequest({ "Queue": "Black" })}>Queue as Black</button>
        </div>
        )}
      </div>
    );
};

export default ChessPluginBox;
