import React, { useEffect, useState } from 'react';
import { ServiceId, parseServiceId } from '@dartfrog/puddle';
import useChessStore, { ChessState } from '../store/chess';
import ChessQueue from './ChessQueue';
import ChessGame from './ChessGame';

interface ChessPluginBoxProps {
  serviceId: ServiceId;
  chessState: ChessState;
}

const ChessPluginBox: React.FC<ChessPluginBoxProps> = ({ serviceId, chessState }) => {
  const { sendChessRequest } = useChessStore();

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let parsedServiceId = parseServiceId(serviceId);
    if (parsedServiceId.node === window.our.node) {
      setIsAdmin(true);
    }
  }, [serviceId]);
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
