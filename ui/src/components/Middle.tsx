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
  const renderBrowser = useCallback(() => {
    return (
      <TabbedWindowManager services={services} />
    );
  }, [services]);

  const gutterStyle = (dimension: "width" | "height", gutterSize: number, index: number) => ({
    cursor: 'col-resize',
    height: '100%',
    width: '2px',
  });

  return (
    <div style={{ height: '100%',
      flexGrow: 1,
      maxHeight: '100%',
      overflowY: 'hidden',
      boxSizing: 'border-box',
    }}>

      <Split
        sizes={isSidebarOpen ? [70, 30] : [100, 0]} // Adjust sizes based on isSidebarOpen
        minSize={isSidebarOpen ? 60 : 0}
        direction="horizontal"
        style={{ display: 'flex', width: '100%', height: '100%'}}
      >
        {renderBrowser()}
        {isSidebarOpen ? (
          <Sidebar />
        ) : (
          <div></div>
        )}
      </Split>
    </div>
  );
};

export default Middle;
