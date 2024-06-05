import { useEffect, useState } from 'react';
import useChatStore from '../store/chat';
import { ConnectionStatusType, ServerStatus } from '../types/types';
// import { pokeUnsubscribe } from '../utils';

const ChatHeader = () => {

  // const { serverStatus, setServerStatus, bannedUsers } = useChatStore();

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);
  const [isBanned, setIsBanned] = useState(false);

  // useEffect(() => {
  //   setIsBanned(bannedUsers.includes(window.our?.node));
  // }, [bannedUsers]);

  const [isConnected, setIsConnected] = useState(false);
  // useEffect(() => {
  //   if (!serverStatus) return;
  //   if (!serverStatus.connection) return;
  //   if (serverStatus.connection.type === ConnectionStatusType.Connected) {
  //     setIsConnected(true);
  //   } else if (serverStatus.connection.type === ConnectionStatusType.Disconnected) {
  //     setIsConnected(false);
  //   }

  // }, [serverStatus]);


  return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#ffffff55",
          fontSize: "0.8rem",
          gap: "0.8rem",
        }}
      >
        <button
          style={{
            opacity: "0.5",
            fontSize: "0.8rem",
            padding: "0px 2px",
            cursor: "pointer",
          }}
          onClick={(e) => {
              // setServerStatus(null);
            // pokeUnsbscribe();
            }
          }
        >
          exit
        </button>
        <span style={{
          // fontFamily:"monospace",
          flexGrow: 1,
          fontSize: "0.7rem",
          cursor: "default",

          }}
        >
          {time.toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              weekday: 'short',
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
        </span>

        {isBanned && 
          <div style={{color:"red", marginRight:"5px"}}>
            you are banned from chatting.
          </div>
        }

        <div
          style={{
            cursor: "default",
          }}
        >
          {'server'} {isConnected ? 'connected' : 'connecting...'}
        </div>

      </div>

  );
}
export default ChatHeader;