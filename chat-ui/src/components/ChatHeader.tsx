import React, { useEffect, useState } from 'react';
import { ServiceId } from '@dartfrog/puddle';

interface ChatHeaderProps {
  serviceId: ServiceId;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ serviceId }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // New state for mute status

  useEffect(() => {
    const mute = sessionStorage.getItem("mute") === "true";
    setIsMuted(mute);
  }, []);
  useEffect(() => {
    sessionStorage.setItem("mute", isMuted ? "true" : "false");
  }, [isMuted]);

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.8rem",
    backgroundColor: "#242424",
  };

  const menuStyle: React.CSSProperties = {
    display: menuOpen ? "flex" : "none",
    height: menuOpen ? "auto" : "0",
    flexDirection: "column" as "column",
    padding: "10px",
    color: "#ffffff44",
    fontSize: "0.8rem",
    transition: "height 0.3s ease",
    backgroundColor: "#242424",
  };

  return (
    <div>
      <div style={headerStyle}>
        <span
          style={{
            userSelect: "none",
            cursor: "pointer",
            color: "#ffffff44",
          }}
          onClick={() => setMenuOpen(!menuOpen)}
          >
          {menuOpen ? 'close menu' : 'menu'}
        </span>
      </div>
      <div style={menuStyle}>
        <button // New mute button
          style={{
            border: "none",
            cursor: "pointer",
            padding: "2px 2px",
          }}
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? 'unmute' : 'mute'}
        </button>
        
        <div>sfx: /yes /no /why /fart /people /robust /robustness</div>
        <div>img: /die /kino /panda /dev /tiger /wow /cry /ok /oops</div>
      </div>
    </div>
  );
}

export default ChatHeader;
