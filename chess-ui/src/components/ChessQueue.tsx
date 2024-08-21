import React from 'react';
import useChessStore, { ChessState } from '../store/chess';
import './ChessPluginBox.css';
import useChatStore from '@dartfrog/puddle/store/service';
import { getPeerNameColor } from '@dartfrog/puddle';

interface ChessQueueProps {
}

const ChessQueue: React.FC<ChessQueueProps> = () => {

  const {api, peerMap} = useChatStore();
  const { chessState, sendChessRequest } = useChessStore();
  return (
    <div
      style={{
        marginBottom: "3rem",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "3rem",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          chess game lobby
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          <div>
          white:
          </div>
        {
          chessState.queuedWhite === null ? (
            <div
              className='queue-button'
              onClick={() => {
                sendChessRequest(api, { "Queue": "White" });
                if (chessState.queuedBlack === null) {  
                  const sound = new Audio('/chess:dartfrog:herobrine.os/assets/chess-queue.mp3');
                  sound.play();
                }
              }}
            >
              join
            </div>
          ) : (
            <div
              className='queue-button-disabled'
            >
              <span
                className={getPeerNameColor(peerMap.get(chessState.queuedWhite))}
              >
                {chessState.queuedWhite}
              </span>
            </div>
          )
        }

        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          <div>
          black:
          </div>
        {
          chessState.queuedBlack === null ? (
            <div
              className='queue-button'
              onClick={() => {
                sendChessRequest(api, { "Queue": "Black" });
                if (chessState.queuedWhite === null) {  
                  const sound = new Audio('/chess:dartfrog:herobrine.os/assets/chess-queue.mp3');
                  sound.play();
                }
              }}
            >
              join
            </div>
          ) : (
            <div
              className='queue-button-disabled'
            >
              <span
                className={getPeerNameColor(peerMap.get(chessState.queuedBlack))}
              >
                {chessState.queuedBlack}
              </span>
            </div>
          )
        }
        </div>
      </div>
    </div>
  );
};

export default ChessQueue;