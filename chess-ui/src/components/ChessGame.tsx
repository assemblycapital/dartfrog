import React, { useState, useEffect, useCallback } from 'react';
import Chessboard from 'chessboardjsx';
import { Chess } from 'chess.js';
import useChessStore, { ChessState } from '../store/chess';
import './ChessPluginBox.css';
import useChatStore from '@dartfrog/puddle/store/service';
import { getPeerNameColor } from '@dartfrog/puddle';

interface ChessGameProps {
}

const ChessGame: React.FC<ChessGameProps> = () => {
  const {api} = useChatStore();
  const { peerMap } = useChatStore();
  const { chessState, sendChessRequest, } = useChessStore();
  const [chess, setChess] = useState(new Chess());
  const [gameFen, setGameFen] = useState(chess.fen());
  const [canPlayerMove, setCanPlayerMove] = useState(false);

  const [myRole, setMyRole] = useState<'white' | 'black' | 'spectator'>('spectator');
  const [topPlayer, setTopPlayer] = useState('');
  const [bottomPlayer, setBottomPlayer] = useState('');
  const [isTopPlayerTurn, setIsTopPlayerTurn] = useState(false);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');

  useEffect(() => {
    if (orientation === 'white') {
      setIsTopPlayerTurn(!chessState.game.isWhiteTurn);
    } else {
      setIsTopPlayerTurn(chessState.game.isWhiteTurn);
    }
  }, [chessState, orientation]);

  const makeNewChess = (moves: string[], playSound: boolean = false) => {
    let newChess = new Chess();
    for (let move of moves) {
      try {
        let result = newChess.move(move);
        if (playSound) {
          if (move === moves[moves.length - 1]) {
            if (result.captured) {
              const sound = new Audio('/chess:dartfrog:herobrine.os/assets/chess-capture.mp3');
              sound.play();
            } else {
              const sound = new Audio('/chess:dartfrog:herobrine.os/assets/chess-move.mp3');
              sound.play();
            }
          }
        }
      } catch (error) {
        return null;
      }
    }
    return newChess;
  }

  useEffect(() => {
    if (!chessState.game) return;
    let newChess = makeNewChess(chessState.game.moves, true);
    if (newChess) {
      setGameFen(newChess.fen());
      setChess(newChess);
    }
    setCanPlayerMove(getCanPlayerMove());
    if (window.our?.node === chessState.game.white) {
      setMyRole('white');
      setTopPlayer(chessState.game.black);
      setBottomPlayer(chessState.game.white);
    } else if (window.our?.node === chessState.game.black) {
      setMyRole('black');
      setTopPlayer(chessState.game.white);
      setBottomPlayer(chessState.game.black);
      setOrientation("black");
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
    if (!canPlayerMove) {
      const sound = new Audio('/chess:dartfrog:herobrine.os/assets/chess-invalid-move.mp3');
      sound.play();
      return;
    }
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
    sendChessRequest(api, { "Move": movetoSend });
  }, [chess, sendChessRequest, canPlayerMove, chessState]);

  return (
    <div className="chess-container"
      style={{
        overflow:"hidden",
      }}
    >
      <div
      >
        <div className="player-info">
          <div
            className={getPeerNameColor(peerMap.get(topPlayer))}
          >
            {topPlayer}
          </div>
          <div>{isTopPlayerTurn && ' to move'}</div>
        </div>
        <Chessboard
          position={gameFen}
          onDrop={onDrop}
          width={320}
          orientation={myRole === 'black' ? 'black' : 'white'}
        />
        <div className="player-info">
          <div
            className={getPeerNameColor(peerMap.get(bottomPlayer))}
          >
            {bottomPlayer}
          </div>
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