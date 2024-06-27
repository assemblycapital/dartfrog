import { useState, useEffect } from "react";
import useDartStore from "../store/dart";
import { IconMail, IconMailUnread } from "./icons/Icons";
import "./ControlHeader.css";

interface ControlHeaderProps {
  // setIsSidebarOpen: (isOpen: boolean) => void;
}

const ControlHeader: React.FC<ControlHeaderProps> = ({ }) => {
  const { api, isClientConnected, sidebar, setSidebar } = useDartStore();
  return (
    <div className="control-header">
      <div className="control-header-left">
        <a href="/" className='home-link control-header-button'>
          <span>home</span>
        </a>
      </div>
      <div className="control-header-right">
        <div className={`user-profile control-header-button ${sidebar === 'profile' ? 'active' : ''}`}
          onClick={() => {
            if (sidebar === 'profile') {
              setSidebar(null);
            } else {
              setSidebar('profile');
            }
          }}
        >
          <span className="username">
            {window.our.node}
          </span>
          {isClientConnected &&
            <span className="connection-status">
              {isClientConnected ? '' : ' connecting...'}
            </span>
          }
        </div>
        {/* <div className={`icon-mail control-header-button ${sidebar === 'messages' ? 'active' : ''}`}
          onClick={() => {
            if (sidebar === 'messages') {
              setSidebar(null);
            } else {
              setSidebar('messages');
            }
          }}
        >
          <IconMail size={'1.5em'} />
        </div> */}
      </div>
    </div>
  );
}

export default ControlHeader;
