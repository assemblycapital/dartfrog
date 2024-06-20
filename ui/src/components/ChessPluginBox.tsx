import React, { useCallback, useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import { ServiceId, parseServiceId } from '@dartfrog/puddle';
import useDartStore from '../store/dart';
import Chessboard from 'chessboardjsx';
import './ChessPluginBox.css'; // Import the CSS file for styling


type ChessState = {
  game:any
}

interface ChessPluginBoxProps {
  serviceId: ServiceId;
  chessState: ChessState;
}

const ChessPluginBox: React.FC<ChessPluginBoxProps> = ({ serviceId, chessState }) => {
  const { pokeService } = useDartStore();
  const [chess] = useState(new Chess());
  const [gameFen, setGameFen] = useState(chess.fen());
  const [canPlayerMove, setCanPlayerMove] = useState(false);

  useEffect(() => {
    if (!chessState.game) return;
    chess.reset();
    for (let move of chessState.game.moves) {
      try {
        const result = chess.move(move);
        if (result === null) {
        }
      } catch (error) {
      }
    }
    setGameFen(chess.fen());
    let canMove = getCanPlayerMove();
    setCanPlayerMove(canMove);
  }, [chessState, chess]);

  const sendChessRequest = useCallback((req) => {
    let request = { PluginRequest: ["chess", JSON.stringify(req)] };
    let parsedServiceId = parseServiceId(serviceId);
    // pokeService(parsedServiceId, request);
  }, [pokeService, serviceId]);

  const onDrop = useCallback((drop) => {
    let res = isMoveValid(drop, chess);
    if (res === null) {
        // invalid move
        return;
    }
    sendChessRequest({ "Move": res });

  }, [chess, sendChessRequest, canPlayerMove]);

  function cloneChess(chessInstance) {
    const newChess = new Chess();
    newChess.load(chessInstance.fen());
    return newChess;
  }
  
  const getCanPlayerMove = useCallback(() => {
    if (!chessState.game) return false;
    const currentPlayer = chessState.game.isWhiteTurn ? 'White' : 'Black';
    const isValidPlayer = (currentPlayer === 'White' && window.our.node === chessState.game.white) ||
                          (currentPlayer === 'Black' && window.our.node === chessState.game.black);
  
    return isValidPlayer;
  }, [chessState]);


  const isMoveValid = useCallback((moveObject, chessInstance) => {
    if (!canPlayerMove) {
      return null;
    }
    const { sourceSquare, targetSquare, piece } = moveObject;
    const clonedChess = cloneChess(chessInstance);
    try {
      const result = clonedChess.move({
        from: sourceSquare,
        to: targetSquare,
      });
      if (result === null) {
        // console.log(`Invalid move attempted: ${sourceSquare} to ${targetSquare}`);
        return null;
      }
      return clonedChess.history()[0];

    } catch (error) {
      // console.log(`Invalid move attempted: ${sourceSquare} to ${targetSquare}`);
      return null;
    }
  }, [canPlayerMove])
  
  return (
    <div className="chess-container">
      {chessState.game ? (
        <>
          <div className="chessboard">
            <Chessboard 
              position={gameFen} 
              width={320}
              onDrop={onDrop} 
            />
          </div>
          <div className="game-info">
            <p>{chessState.game.isWhiteTurn}</p>
            <p>Current Turn: {chessState.game.isWhiteTurn ? 'White' : 'Black'}</p>
            <p>White Player: {chessState.game.white}</p>
            <p>Black Player: {chessState.game.black}</p>
          </div>
        </>
      ) : (
        <div>
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
              chess game lobby
            </div>
            {/* <p>Queued White Player: {chessState.queuedWhite || "None"}</p>
            <p>Queued Black Player: {chessState.queuedBlack || "None"}</p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <button 
                className='queue-button'
                onClick={() => sendChessRequest({ "Queue": "White" })}
                disabled={chessState.queuedWhite !== null}
              >
                Queue as White
              </button>
              <button 
                className='queue-button'
                onClick={() => sendChessRequest({ "Queue": "Black" })}
                disabled={chessState.queuedBlack !== null}
              >
                Queue as Black
              </button>
            </div> */}
        </div>
      )}
    </div>
  );
};

export default ChessPluginBox;
