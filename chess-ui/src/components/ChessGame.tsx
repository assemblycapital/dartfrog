import React, { useState, useEffect, useCallback } from 'react';
import Chessboard from 'chessboardjsx';
import { Chess } from 'chess.js';
import { ChessState } from '../store/chess';
import './ChessPluginBox.css';
import { parseServiceId } from '@dartfrog/puddle';

interface ChessGameProps {
  chessState: ChessState;
  sendChessRequest: (request: any) => void;
  serviceId: string;
}

const ChessGame: React.FC<ChessGameProps> = ({ chessState, sendChessRequest, serviceId }) => {
  const [chess, setChess] = useState(new Chess());
  const [gameFen, setGameFen] = useState(chess.fen());
  const [canPlayerMove, setCanPlayerMove] = useState(false);

  const [myRole, setMyRole] = useState<'white' | 'black' | 'spectator'>('spectator');
  const [topPlayer, setTopPlayer] = useState('');
  const [bottomPlayer, setBottomPlayer] = useState('');
  const [isTopPlayerTurn, setIsTopPlayerTurn] = useState(false);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');


  useEffect(() => {
    setOrientation(myRole === 'black' ? 'black' : 'white');
  }, [myRole]);
  
  useEffect(() => {
    if (orientation === 'white') {
      setIsTopPlayerTurn(!chessState.game.isWhiteTurn);
    } else {
      setIsTopPlayerTurn(chessState.game.isWhiteTurn);
    }
  }, [chessState]);

  const makeNewChess = (moves: string[]) => {
    let newChess = new Chess();
    for (let move of moves) {
      try {
        newChess.move(move);
      } catch (error) {
        return null;
      }
    }
    return newChess;
  }

  useEffect(() => {
    if (!chessState.game) return;
    let newChess = makeNewChess(chessState.game.moves);
    if (newChess) {
      setGameFen(newChess.fen());
      setChess(newChess);
    }
    setCanPlayerMove(getCanPlayerMove());
    if (window.our?.node === chessState.game.white) {
      setMyRole('white');
      setTopPlayer(chessState.game.white);
      setBottomPlayer(chessState.game.black);
    } else if (window.our?.node === chessState.game.black) {
      setMyRole('black');
      setTopPlayer(chessState.game.white);
      setBottomPlayer(chessState.game.black);
    } else {
      setMyRole('spectator');
      setTopPlayer(chessState.game.black);
      setBottomPlayer(chessState.game.white);
    }
  }, [chessState]);

  const getCanPlayerMove = useCallback(() => {
    if (!chessState.game) return false;
    const currentPlayer = chessState.game.isWhiteTurn ? 'White' : 'Black';
    return (currentPlayer === 'White' && window.our.node === chessState.game.white) ||
           (currentPlayer === 'Black' && window.our.node === chessState.game.black);
  }, [chessState]);

  const onDrop = useCallback((drop) => {
    if (!canPlayerMove) return;
    const { sourceSquare, targetSquare } = drop;
    const move = { from: sourceSquare, to: targetSquare, promotion: 'q' }; // Assume queen promotion for simplicity
    let tempChess = makeNewChess(chessState.game.moves);
    if (!tempChess) return;
    let result;
    try {
      result = tempChess.move(move);
    } catch (error) {
      const sound = new Audio('/chess:dartfrog:herobrine.os/assets/chess-invalid-move.mp3');
      sound.play();
      return;
    }
    let movetoSend = result.san;
    sendChessRequest({ "Move": movetoSend });
  }, [chess, sendChessRequest, canPlayerMove, chessState]);

  return (
    <div className="chess-container">
      <div>
        <div className="player-info">
          <div>{topPlayer}</div>
          <div>{isTopPlayerTurn && ' to move'}</div>
        </div>
        <Chessboard
          position={gameFen}
          onDrop={onDrop}
          width={320}
          orientation={myRole === 'black' ? 'black' : 'white'}
        />
        <div className="player-info">
          <div>{bottomPlayer}</div>
          <div>{!isTopPlayerTurn && ' to move'}</div>
        </div>
      </div>

      {/* <div className="game-info">
        <div>Current Turn: {chessState.game.isWhiteTurn ? 'White' : 'Black'}</div>
        <div>White Player: {chessState.game.white}</div>
        <div>Black Player: {chessState.game.black}</div>
        {canPlayerMove && <div>Your move.</div>}
      </div> */}
    </div>
  );
};

export default ChessGame;