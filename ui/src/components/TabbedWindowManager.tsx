import React, { useEffect } from 'react';
import { ServiceId, Service } from '@dartfrog/puddle';
import ServiceTab from './ServiceTab';
import useDartStore from '../store/dart';
import './TabbedWindowManager.css';
import { PlusIcon } from './icons/Icons';
import NewTab from './NewTab/NewTab';
import { HUB_NODE } from '../utils';
import TabTop from './TabTop';
import TabTops from './TabTops';
import Split from 'react-split';
import Footer from './Footer';

interface TabbedWindowManagerProps {
  services: Map<ServiceId, Service>;
}

const TabbedWindowManager: React.FC<TabbedWindowManagerProps> = ({ services }) => {
  const { tabs, activeTabIndex, setTabs, setActiveTabIndex, addTab, closeTab, setFromNewTab, joinService, exitService } = useDartStore();

  useEffect(() => {
    if (!(services instanceof Map)) return;
    tabs.forEach(tab => {
      if (tab && tab.serviceId) {
        const service = services.get(tab.serviceId);
        if (!service) {
          joinService(tab.serviceId);
        }
      }
    });
  }, [tabs, services, joinService]);

  return (
    <div
      style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        // border: "1px solid yellow",
        // padding: "1rem",
        overflowY: 'hidden', // Ensure no overflow on the main container
      }}
    >
     
      {/* this is the topbar of constant size */}
      <div style={{
        height: "26px",
        display: "block",
        flexShrink: 0, // Ensure this div does not shrink
      }}>
        <TabTops />
      </div>

      <Split
        sizes={[80,20]}
        direction="vertical"
        style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >


      {/* this is the scrollable area */}
      <div style={{
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}>

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
          <div
            style={{
              height: '100%',
              maxHeight: '100%',
              minHeight: '100%',
              boxSizing: 'border-box',
              // border: "1px solid blue",
              // padding: "2px",
            }}
          >
            {!tabs[activeTabIndex].serviceId ? (
                <NewTab 
                  setTabService={(serviceId: ServiceId) => {
                    setFromNewTab(serviceId);
                  }}
                />
            ):(
                <ServiceTab
                  serviceId={tabs[activeTabIndex].serviceId}
                  services={services}
                  addTab={addTab}
                />
            )}
          </div>
        )}
      </div>
      <Footer />
      </Split>
    </div>
  );
};

export default TabbedWindowManager;
