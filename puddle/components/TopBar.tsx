import * as React from 'react';
import { useState } from 'react';
import { HamburgerIcon, HomeIcon } from '@dartfrog/puddle/components/Icons';

const TopBar = ({ serviceId }) => {
  const [serviceIdDisplayText, setServiceIdDisplayText] = useState(`df://${serviceId}`);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(`df://${serviceId}`);
    setServiceIdDisplayText("copied link to clipboard!");
    setTimeout(() => {
      setServiceIdDisplayText(`df://${serviceId}`);
    }, 2000); // Revert back after 2 seconds
  };

  const baseOrigin = window.origin.split(".").slice(1).join(".")
  return (
    <div
    style={{
      fontSize: '0.8rem',
      color: '#9d9d9d',
      backgroundColor: '#333',
      textAlign: 'center',
      padding: '0 8px',
      height: '26px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'default',
      position: 'relative',
      userSelect:'none',
    }}
  >
    <a
      style={{
        position: 'absolute',
        left: '0px',
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        cursor: 'pointer',
        padding: '0px 10px'

      }}
      className="hover-dark-gray"
      href={`http://${baseOrigin}/dartfrog:dartfrog:herobrine.os/`}
    >
        <HomeIcon size='15px' color='#9d9d9d' />
    </a>
    <div
      style={{
        width:"40px"
      }}
    >
    </div>
      <div
        style={{
          flexGrow: "1",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            cursor: "pointer",
            overflowX: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis", 
            wordWrap: "normal",
          }}
          onClick={handleCopyClick}
        >
          {serviceIdDisplayText}
        </div>
      </div>
      {/* <div
        className="hover-dark-gray"
        style={{
          position: 'absolute',
          right: '0px',
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          cursor: 'pointer',
          padding: '0px 10px'
  
        }}
      >
        <HamburgerIcon height='1em' width='1em' color='#b4b4b4' />
      </div> */}
    </div>
  );
};

export default TopBar;