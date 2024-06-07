import React, { useEffect, useState } from 'react';
import { ServiceId, Service } from '../dartclientlib';
import OpenServiceTab from './ServiceTab';
import useDartStore from '../store/dart';
import './TabbedWindowManager.css';
import { PlusIcon, XIcon } from './icons/Icons';

interface Tab {
  serviceId: ServiceId | null;
}

const TabbedWindowManager: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    {serviceId: "fake.dev:chat"},
    {serviceId: null},
  ]);

  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [currentTabId, setCurrentTabId] = useState<ServiceId | null>(null);
  const [currentTabService, setCurrentTabService] = useState<Service | null>(null);

  const {services} = useDartStore();

  useEffect(() => {
    if (!tabs[activeTabIndex]) return;
    setCurrentTabId(tabs[activeTabIndex].serviceId)
    if (tabs[activeTabIndex].serviceId === null) {
      setCurrentTabService(null);
    } else {
      // fetch service
      let got = services.get(tabs[activeTabIndex].serviceId as ServiceId)
      if (got) {
        console.log("got service", got)
        setCurrentTabService(got)
      } else {
        console.log("service not found")
      }
    }
  }, [tabs, activeTabIndex]);

  const addTab = () => {
    const newTab: Tab = {
      serviceId: null,
    };
    setTabs([...tabs, newTab]);
  };

  const removeTab = (index: number) => {
    setTabs(tabs.filter((_, i) => i !== index));
    if (index === activeTabIndex) {
      setActiveTabIndex(0);
    } else if (index < activeTabIndex) {
      setActiveTabIndex(activeTabIndex - 1);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex' }}>
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
                <div onClick={() => removeTab(index)}
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
        // style={{
        //   borderBottom: '1px solid #ffffff33',
        // }}
      >
        {tabs.length === 0 ? "TODO" : 
          <div>
              {currentTabId === null ? "TODO" :
                <>
                {!currentTabService ? "TODO" :
                  <OpenServiceTab
                    service={currentTabService}
                    />
                }
                </>
              }
          </div>
        }
      </div>
    </div>
  );
};

export default TabbedWindowManager;
