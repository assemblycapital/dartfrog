import React, { useCallback, useEffect, useState } from 'react';
import { ServiceId, Service, parseServiceId, AvailableServices } from '@dartfrog/puddle';
import ServiceTab from './ServiceTab';
import useDartStore from '../store/dart';
import './TabbedWindowManager.css';
import { PlusIcon, XIcon } from './icons/Icons';
import NewTab from './NewTab/NewTab';
import { join } from 'path';
import { HUB_NODE } from '../utils';
import Spinner from './Spinner';

interface Tab {
  serviceId: ServiceId | null;
}

interface TabbedWindowManagerProps {
  services: Map<ServiceId, Service>;
}

const TabbedWindowManager: React.FC<TabbedWindowManagerProps> = ({services}) => {
  const [tabs, setTabs] = useState<Tab[]>([
    { serviceId: "chat."+HUB_NODE},
    { serviceId: null },
  ]);

  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [currentTabService, setCurrentTabService] = useState<Service | null>(null);
  const { exitService, joinService } = useDartStore();

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

  }, [tabs, services]);

  const addTab = useCallback((maybeServiceId: ServiceId | null) => {
    setTabs(prevTabs => {
      const newTabs = [...prevTabs, { serviceId: maybeServiceId }];
      setActiveTabIndex(newTabs.length - 1);  // Set the active tab index to the new tab
      return newTabs;
    });
  }, []);
  

  const closeTab = useCallback((index: number) => {
    setTabs(prevTabs => prevTabs.filter((_, i) => i !== index));
    if (index === activeTabIndex) {
      setActiveTabIndex(prevIndex => prevIndex === 0 ? 0 : prevIndex - 1);
    } else if (index < activeTabIndex) {
      setActiveTabIndex(prevIndex => prevIndex - 1);
    }
  }, [activeTabIndex]);

  const setFromNewTab = useCallback((serviceId: string) => {
    setTabs(currentTabs => {
      const updatedTabs = [...currentTabs];
      updatedTabs[activeTabIndex] = {...updatedTabs[activeTabIndex], serviceId};
      return updatedTabs;
    });
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
                    e.stopPropagation();
                    // Exit service if there is one
                    if (tab.serviceId) {
                      // also check that no other tabs are using this service
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
        <button onClick={() =>addTab(null)}
          className="add-tab-button"
        >
          <PlusIcon />
        </button>
      </div>
      <div>
        {tabs.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '400px',
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
                height: '40px', // Adjust this value as needed
              }}
              onClick={() => addTab(null)}
            >
              create a new tab
            </button>
          </div>
        ) : (
          <div>
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
    </div>
  );
};

export default TabbedWindowManager;
