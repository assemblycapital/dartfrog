import React from 'react';
import { useLocation } from 'react-router-dom';
import TabbedWindowManager from './TabbedWindowManager';
import Sidebar from './Sidebar/Sidebar';
import useDartStore from '../store/dart';
import Split from 'react-split';
import Footer from './Footer';
import NewTab from './NewTab/NewTab';
import JoinPage from './JoinPage';
import Home from './Home';

interface MiddleProps {
}

const Middle: React.FC<MiddleProps> = ({ }) => {
  const { isSidebarOpen, isClientConnected } = useDartStore();

  return (
    
    <div style={{ height: '100%',
      flexGrow: 1,
      maxHeight: '100%',
      overflowY: 'hidden',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }}>

       {!isClientConnected ? (

        <div>loading</div>
       ):(
            <Split
              sizes={isSidebarOpen ? [80, 20] : [100, 0]}
              minSize={isSidebarOpen ? [60, 60] : [0, 0]}
              direction="horizontal"
              gutterSize={10}
              style={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'row',
                overflowX: 'hidden',
              }}
            >
              <div>
                <NewTab />
                {/* <Home /> */}
              </div>

              {isSidebarOpen ? (
                  <div>
                    <Sidebar />
                  </div>
              ) : (
                <div></div>
              )}
            </Split>
       )}
    </div>
  );
};

export default Middle;