import React from 'react';
import ServiceTab from './ServiceTab';
import NewTab from './NewTab/NewTab';

import useDartStore, { Tab } from '../store/dart';
import TabbedWindow from './TabbedWindow';
interface TabbedWindowStackProps {
}

const TabbedWindowStack: React.FC<TabbedWindowStackProps> = ({ }) => {
  const { tabs, activeTabIndex, services, setTabs, setActiveTabIndex, addTab, closeTab, setFromNewTab, joinService, exitService } = useDartStore();

  return (
    <div style={{ overflowY: 'auto', boxSizing: 'border-box', position: 'relative', height: '100%' }}>
      {tabs.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: '#ffffff55',
          }}
        >
          <button
            style={{
              padding: '8px',
              border: '1px solid #ffffff55',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '200px',
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '40px',
            }}
            onClick={() => addTab(null)}
          >
            create a new tab
          </button>
        </div>
      ) : (
        tabs.map((tab, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: index === activeTabIndex ? 5 : 1,
              backgroundColor: '#242424',
              display: index === activeTabIndex ? 'inline-block' : 'none',
            }}
          >
            <TabbedWindow tab={tab} />
          </div>
        ))
      )}
    </div>
  );
};

export default TabbedWindowStack;
