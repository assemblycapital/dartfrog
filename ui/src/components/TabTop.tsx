import React, { useEffect, useState } from 'react';
import { PlusIcon, XIcon } from './icons/Icons';

const Tab = ({ tab, index, activeTabIndex, setActiveTabIndex, closeTab, tabs, exitService }) => {

  const [isActive, setIsActive] = useState(false);
  const [displayText, setDisplayText] = useState(tab.serviceId ? tab.serviceId : 'new tab');

  useEffect(() => {
    setIsActive(activeTabIndex === index);
  }, [activeTabIndex, index]);

  useEffect(() => {
    setDisplayText(tab.serviceId ? tab.serviceId : 'new tab');
  }, [tab]);


  return (
    <div
      className={`tab ${isActive ? 'active' : 'inactive'}`}
      onClick={() => setActiveTabIndex(index)}
    >
      <div
        style={{
          flexGrow: 1,
          alignContent: 'center',
          marginLeft: '8px',
        }}
        onClick={(e) => {
          if(isActive) {
            if (tab.serviceId) {
              navigator.clipboard.writeText(`df://${tab.serviceId}`);
              setDisplayText('copied link!');
              setTimeout(() => setDisplayText(tab.serviceId), 1500);
            }
          }
        }}
      >
        {displayText}
      </div>
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (tab.serviceId) {
            const isServiceUsedByOtherTabs = tabs.some((t, i) => i !== index && t.serviceId === tab.serviceId);
            if (!isServiceUsedByOtherTabs) {
              exitService(tab.serviceId);
            }
          }
          closeTab(index);
        }}
        className="close-tab-button"
      >
        <XIcon />
      </div>
    </div>
  );
};

export default Tab;
