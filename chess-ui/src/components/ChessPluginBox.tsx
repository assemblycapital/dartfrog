import React, { useEffect, useState } from 'react';
import useChessStore, { ChessState } from '../store/chess';
import ChessQueue from './ChessQueue';
import ChessGame from './ChessGame';
import { ServiceID } from '@dartfrog/puddle';
import useChatStore from '@dartfrog/puddle/store/chat';

interface ChessPluginBoxProps {
}

const ChessPluginBox: React.FC = ({ }) => {
  const {api} = useChatStore();
  const {serviceId} = useChatStore();
  const { chessState, sendChessRequest, } = useChessStore();

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const parsedServiceId = ServiceID.fromString(serviceId);
    if (!parsedServiceId) return;
    setIsAdmin(parsedServiceId.hostNode() === window.our?.node);
  }, [serviceId]);


  if (!chessState) {
    return (
      <div>
        loading...
      </div>
    )
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: "0.8rem",
        height:"100%",
        overflow:"hidden",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {chessState.game ? (
        <ChessGame />
      ) : (
        <ChessQueue />
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
          <button onClick={() => sendChessRequest(api, "Reset")}
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
