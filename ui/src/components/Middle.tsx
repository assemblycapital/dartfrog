import React, { useCallback } from 'react';
import TabbedWindowManager from './TabbedWindowManager';
import Sidebar from './Sidebar/Sidebar';
import useDartStore from '../store/dart';
import Split from 'react-split';
import Footer from './Footer';

interface MiddleProps {
}

const Middle: React.FC<MiddleProps> = ({ }) => {

  const { services, sidebar } = useDartStore();
  const renderBrowser = useCallback(() => {
    return (
      <div style={{ height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div
          style={{
            flexGrow:1,
            height: '100%',
          }}
        >
          <TabbedWindowManager services={services} />
        </div>
        <div
          style={{
            flexShrink: 0,
          }}
        >
          <Footer />

        </div>
      </div>
    );
  }, [services]);
  if (sidebar === null) {
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
    }}>
      <Split
      sizes={[60, 40]}
      minSize={60}
      direction="horizontal"
      style={{ display: 'flex', width: '100%', height: '100%'}}
    >
      {renderBrowser()}
      {sidebar && (
        <div style={{ height: '100%' }}>
          <Sidebar />
        </div>
      )}
    </Split>
    </div>
  );
};

export default Middle;
