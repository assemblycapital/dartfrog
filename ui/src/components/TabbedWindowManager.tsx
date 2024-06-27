import React, { useEffect } from 'react';
import { ServiceId, Service } from '@dartfrog/puddle';
import ServiceTab from './ServiceTab';
import useDartStore from '../store/dart';
import './TabbedWindowManager.css';
import { PlusIcon } from './icons/Icons';
import NewTab from './NewTab/NewTab';
import { HUB_NODE } from '../utils';
import TabTop from './TabTop';

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
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        borderBottom: '2px solid #ffffff22',
        overflowX: "hidden",
        overflowY: "hidden",
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
            <TabTop
              tab={tab}
              index={index}
              activeTabIndex={activeTabIndex}
              setActiveTabIndex={setActiveTabIndex}
              closeTab={closeTab}
              tabs={tabs}
              exitService={exitService}
            />
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
        <div onClick={() => addTab(null)}
          className="add-tab-button"
        >
          <PlusIcon />
        </div>
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
                height: '40px',
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
