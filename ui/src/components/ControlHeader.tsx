import { useState, useEffect } from "react";
import useDartStore from "../store/dart";

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
          {' '} {isClientConnected ? 'connected': 'connecting...'}
          </span>
        </div>

      </div>

  );
}
export default ControlHeader;