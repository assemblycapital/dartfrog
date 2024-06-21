import React from 'react';
import { ChessState } from '../store/chess';
import './ChessPluginBox.css';

interface ChessQueueProps {
  chessState: ChessState;
  sendChessRequest: (request: any) => void;
  serviceId: string;
}

const ChessQueue: React.FC<ChessQueueProps> = ({ chessState, sendChessRequest, serviceId }) => {
  return (
    <div
      style={{
        marginBottom: "3rem",
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
                sendChessRequest({ "Queue": "White" });
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
              <span>
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
                sendChessRequest({ "Queue": "Black" });
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
              <span>
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