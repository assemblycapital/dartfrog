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
import TabbedWindow from './TabbedWindowStack';
import TabbedWindowStack from './TabbedWindowStack';

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
        minSize={[80, 30]}
        direction="vertical"
        style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <div>

          <TabbedWindowStack />
        </div>
      
        <div>

          <Footer />
        </div>
      </Split>
    </div>
  );
};

export default TabbedWindowManager;
