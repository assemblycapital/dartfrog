import React, { useCallback, useEffect, useState } from 'react';
import { ServiceId, Service } from '../dartclientlib';
import OpenServiceTab from './ServiceTab';
import useDartStore from '../store/dart';
import './TabbedWindowManager.css';
import { PlusIcon, XIcon } from './icons/Icons';
import NewTab from './NewTab';

interface Tab {
  serviceId: ServiceId | null;
}

const TabbedWindowManager: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    {serviceId: "fake.dev:chat"},
    {serviceId: null},
  ]);

  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  // const [currentTabId, setCurrentTabId] = useState<ServiceId | null>(null);
  const [currentTabService, setCurrentTabService] = useState<Service | null>(null);

  const {services} = useDartStore();

   // Simplify the effect that updates service-related states
   useEffect(() => {
    const currentTab = tabs[activeTabIndex];
    if (currentTab && currentTab.serviceId) {
      const service = services.get(currentTab.serviceId);
      if (service) {
        // console.log("Service found:", service);
      } else {
        console.log("Service not found");
      }
    }
  }, [tabs, activeTabIndex, services]);

  useEffect(() => {

    const currentTab = tabs[activeTabIndex];
    if (currentTab && currentTab.serviceId) {
      // setCurrentTabId(currentTab.serviceId);
      const service = services.get(currentTab.serviceId);
      if (service) {
        setCurrentTabService(service);
      } else {
        setCurrentTabService(null);
      }
    } else {
      setCurrentTabService(null);
    }
  }, [activeTabIndex])

  const addTab = useCallback(() => {
    setTabs(prevTabs => [...prevTabs, { serviceId: null }]);
  }, []);

  const closeTab = useCallback((index: number) => {
    setTabs(prevTabs => prevTabs.filter((_, i) => i !== index));
    if (index === activeTabIndex) {
      setActiveTabIndex(prevIndex => prevIndex === 0 ? 0 : prevIndex - 1);
    } else if (index < activeTabIndex) {
      setActiveTabIndex(prevIndex => prevIndex - 1);
    }
  }, [activeTabIndex]);

  return (
    <div>
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #ffffff22',


       }}>
        {tabs.map((tab, index) => (
          <div key={index}
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignContent: 'center',
              alignItems: 'center',
              userSelect: 'none'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}>
              <div
                className={`tab ${activeTabIndex === index ? 'active' : 'inactive'}`}
                onClick={() => setActiveTabIndex(index)}
              >
                <div
                  style={{
                    flexGrow: 1,
                    alignContent: 'center',
                    marginLeft: '8px',

                  }}
                >
                  {tab.serviceId ? tab.serviceId : 'new tab'}
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation(); // This stops the click event from bubbling up to the parent div
                    closeTab(index);
                  }}
                  className="close-tab-button"
                >
                  <XIcon />
                </div>
              </div>
            </div>
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              }}
            >
              <div className="vertical-line"></div>
          </div>
          </div>
        ))}
        <button onClick={addTab}
          className="add-tab-button"
          >
          <PlusIcon />
        </button>
      </div>
      <div
      >
        {tabs.length === 0 ? (
          "no tabs open" 
        ): (
          <div>
              {!currentTabService ? (
                // "tab creation screen..."
                <NewTab />
              ):(
                <OpenServiceTab
                  service={currentTabService}
                  />
              )
              }
          </div>
        )
        }
      </div>
    </div>
  );
};

export default TabbedWindowManager;
