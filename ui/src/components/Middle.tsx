import React, { useCallback } from 'react';
import TabbedWindowManager from './TabbedWindowManager';
import Sidebar from './Sidebar/Sidebar';
import useDartStore from '../store/dart';
import Split from 'react-split';
import Footer from './Footer';

interface MiddleProps {
}

const Middle: React.FC<MiddleProps> = ({ }) => {

  const { services, isSidebarOpen } = useDartStore();

  return (
    <div style={{ height: '100%',
      flexGrow: 1,
      maxHeight: '100%',
      overflowY: 'hidden',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }}>

      <Split
        sizes={isSidebarOpen ? [80, 20] : [100, 0]} // Adjust sizes based on isSidebarOpen
        minSize={isSidebarOpen ? [60, 60] : [0, 0]} // Ensure minimum size for sidebar
        direction="horizontal"
        gutterSize={10} // Adjust gutter size for better resizing
        style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'row',
          // width: '100%',
          // height: '100%'
        }}
      >
        <div>

        <TabbedWindowManager services={services} />
        </div>

        {isSidebarOpen ? (
            <div>
  
            <Sidebar />
            </div>

        ) : (
          <div></div>
        )}
      </Split>
    </div>
  );
};

export default Middle;
