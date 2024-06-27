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
    if (!isSidebarOpen) {
    return renderBrowser();
  }


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
      sizes={[60, 40]}
      minSize={60}
      direction="horizontal"
      style={{ display: 'flex', width: '100%', height: '100%', boxSizing: 'border-box'}}
    >
      {renderBrowser()}
      {isSidebarOpen && (
        <div style={{ height: '100%', boxSizing: 'border-box'}}>
          <Sidebar />
        </div>
      )}
    </Split>
    </div>
  );
};

export default Middle;
