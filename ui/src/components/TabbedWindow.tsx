import React from 'react';
import ServiceTab from './ServiceTab';

import useDartStore from '../store/dart';
interface TabbedWindowProps {
  // tab: Tab;
}

const TabbedWindow: React.FC<TabbedWindowProps> = ({ }) => {
  // const { tabs, activeTabIndex, services, setTabs, setActiveTabIndex, addTab, closeTab, setFromNewTab, joinService, exitService } = useDartStore();

  
  return (
        <div
          style={{
            height: '100%',
            maxHeight: '100%',
            minHeight: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* {!tab.serviceId ? (
            <NewTab 
              // setTabService={(serviceId: string) => {
              //   setFromNewTab(serviceId);
              // }}
            />
          ) : (
            <ServiceTab
              serviceId={tab.serviceId}
              addTab={addTab}
            />
          )} */}
        </div>
  )
};

export default TabbedWindow;
