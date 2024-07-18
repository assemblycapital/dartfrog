import React, { useState } from 'react';
import { HamburgerIcon } from './Icons';

const TopBar = ({ serviceId }) => {
  const [serviceIdDisplayText, setServiceIdDisplayText] = useState(serviceId);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(`df://${serviceId}`);
    setServiceIdDisplayText("copied to clipboard!");
    setTimeout(() => {
      setServiceIdDisplayText(serviceId);
    }, 2000); // Revert back after 2 seconds
  };

  return (
    <div
      style={{
        fontSize: "0.8rem",
        display: "flex",
        flexDirection: "row",
        gap: "4px",
        height:"26px",
        maxHeight:"26px",
        maxWidth:"100%",
        alignItems: "center", // Center items vertically
      }}
    >
      <div
        className='home-link'
        style={{
          display: "inline-block",
          cursor: "pointer"
        }}
        onClick={() => {
          window.location.href = "/dartfrog:dartfrog:herobrine.os/"
        }}
      >
        home
      </div>
      <div
        style={{
          flexGrow: "1",
          overflow: "hidden",
          display: "flex", // Add this line
          alignItems: "center", // Add this line
        }}
      >
        <div
          style={{
            display: "inline-block",
            cursor: "pointer",
            padding: "0rem 1rem",
            overflowX: "hidden",
            whiteSpace: "nowrap", // Prevent text wrapping
            textOverflow: "ellipsis", // Add ellipsis for overflowed text
            wordWrap: "normal",
          }}
          onClick={handleCopyClick}
        >
          {serviceIdDisplayText}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          cursor: "pointer",
          gap: "1rem",
          alignItems: 'center',
        }}
      >
        <div>
          {window.our?.node}
        </div>
        <HamburgerIcon height='1em' width='1em' color='#b4b4b4' />
      </div>
    </div>
  );
};

export default TopBar;