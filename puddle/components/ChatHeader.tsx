import React, { useEffect, useState } from 'react';
import {  } from '@dartfrog/puddle';
import useChatStore from '../store/service';

interface ChatHeaderProps {
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const {peerMap, chatSoundsEnabled, setChatSoundsEnabled} = useChatStore();

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
    // padding: "10px",
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
          className='df'
          onClick={() => setChatSoundsEnabled(!chatSoundsEnabled)}
        >
          {(!chatSoundsEnabled) ? 'unmute' : 'mute'}
        </button>
        
        <div>img: /die /kino /panda /dev /tiger /wow /cry /ok /oops</div>
        {chatSoundsEnabled &&
          <div>sfx: /yes /no /why /fart /people /robust /robustness</div>
        }
      </div>
    </div>
  );
}

export default ChatHeader;
