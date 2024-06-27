import { useState, useEffect } from "react";
import useDartStore from "../store/dart";
import { HamburgerIcon, IconMail, IconMailUnread } from "./icons/Icons";
import "./ControlHeader.css";

interface ControlHeaderProps {
  // setIsSidebarOpen: (isOpen: boolean) => void;
}

const ControlHeader: React.FC<ControlHeaderProps> = ({ }) => {
  const { api, isClientConnected, isSidebarOpen, setIsSidebarOpen } = useDartStore();
  return (
    <div className="control-header">
      <div className="control-header-left">
        <a href="/" className='home-link control-header-button'>
          <span>home</span>
        </a>
      </div>
      <div className="control-header-right">
        {!isClientConnected && <div className="connection-status">connecting...</div>}
          <div className={`sidebar-toggle control-header-button ${isSidebarOpen ? 'active' : ''}`}
            onClick={() => {
              if (isSidebarOpen) {
                setIsSidebarOpen(false);
              } else {
                setIsSidebarOpen(true);
              }
            }}
          >
            <span className="username">
              {window.our.node}
            </span>
            <HamburgerIcon height='1em' width='1em' color='#b4b4b4'/>
          </div>
      </div>
    </div>
  );
}

export default ControlHeader;
