import { useState, useEffect } from "react";
import useDartStore from "../store/dart";
import { IconMailUnread } from "./icons/Icons";

// type ControlHeaderProps = {
//   nodeConnected: boolean;
// };

// const ControlHeader = ({ nodeConnected }: ControlHeaderProps) => {
const ControlHeader = () => {

  // const { muteSoundEffects, setMuteSoundEffects } = useChatStore();
  const { api, isClientConnected } = useDartStore();

  return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          color: "#ffffff55",
          fontSize: "0.8rem",
          gap: "0.8rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "0.8rem",
            flexGrow: 1,
          }}
        >
          <a href="/"
            className='home-link'
            style={{
              cursor: "pointer",
              textDecoration:"underline"
            }}
          >
            <div>
                <span
                >
                home
                </span>
            </div>
          </a>

        </div>

        <div>
          <span
          style={{
            cursor: "default",
            userSelect: "none",
          }}
          >
            <span
              style={{
                fontWeight: "bold",
              }}
            >
              {window.our.node}
            </span>
          {isClientConnected ? '': ' connecting...'}
          </span>
        </div>
        <div
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => {
            alert('DMs and service invites coming soon');
          }}
        >
          <IconMailUnread size={'1.5em'}/>
        </div>

      </div>

  );
}
export default ControlHeader;