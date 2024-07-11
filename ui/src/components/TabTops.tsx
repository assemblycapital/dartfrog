import React from 'react';
import TabTop from './TabTop';
import { PlusIcon } from './icons/Icons';
import useDartStore from '../store/dart';

const TabTops = ({  }) => {

  // const { tabs, activeTabIndex, setTabs, setActiveTabIndex, addTab, closeTab, setFromNewTab, joinService, exitService } = useDartStore();
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      backgroundColor: '#1f1f1f',
      height: "26px",
      overflowX: "hidden",
      overflowY: "hidden",
    }}>
      {/* {tabs.map((tab, index) => (
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
      ))} */}

      {/* <div onClick={() => addTab(null)}
        className="add-tab-button"
      >
        <PlusIcon className="add-tab-button-svg"/>
      </div> */}
    </div>
  );
};

export default TabTops;
