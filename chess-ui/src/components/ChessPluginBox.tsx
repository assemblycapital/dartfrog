import React, { useEffect, useState } from 'react';
import { ServiceId, computeColorForName, parseServiceId } from '@dartfrog/puddle';
import useChessStore, { ChessState } from '../store/chess';
import ChessQueue from './ChessQueue';
import ChessGame from './ChessGame';

interface ChessPluginBoxProps {
  serviceId: ServiceId;
  chessState: ChessState;
}

const ChessPluginBox: React.FC<ChessPluginBoxProps> = ({ serviceId, chessState }) => {
  const { sendChessRequest, nameColors, addNameColor } = useChessStore();

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let parsedServiceId = parseServiceId(serviceId);
    if (!parsedServiceId) {
      return;
    }
    if (parsedServiceId.node === window.our.node) {
      setIsAdmin(true);
    }
  }, [serviceId]);

  useEffect(() => {
    // Precompute name colors for all messages
    let players = Array<string>();

    if (chessState.queuedWhite) {
      players.push(chessState.queuedWhite);
    }
    if (chessState.queuedBlack) {
      players.push(chessState.queuedBlack);
    }
    if (chessState.game) {
      players.push(chessState.game.white);
      players.push(chessState.game.black);
    }

    for (let player of players) {
      if (!nameColors[player]) {
        const color = computeColorForName(player);
        addNameColor(player, color);
      }
    };

  }, [chessState, nameColors, addNameColor]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: "0.8rem",
      }}
    >
      {chessState.game ? (
        <ChessGame chessState={chessState} sendChessRequest={sendChessRequest} serviceId={serviceId} />
      ) : (
        <ChessQueue chessState={chessState} sendChessRequest={sendChessRequest} serviceId={serviceId} />
      )}
      {isAdmin &&
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          <button onClick={() => sendChessRequest("Reset")}
            style={{
              justifySelf: 'flex-start',
              justifyContent: 'flex-start',
            }}
          >
            Reset
          </button>
        </div>
      }
    </div>
  );
};

export default ChessPluginBox;
