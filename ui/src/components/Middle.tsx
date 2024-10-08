import React from 'react';
import { useLocation } from 'react-router-dom';
import TabbedWindowManager from './TabbedWindowManager';
import Sidebar from './Sidebar/Sidebar';
import useDartStore from '../store/dart';
import Split from 'react-split';
import Footer from './Footer';
import Nodes from './Nodes/Nodes';
import JoinPage from './JoinPage';
import Home from './Home';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Services from './Services/Services';
import NodeProfile from './Nodes/NodeProfile';
import Messages from './Messages/Messages';
import CurrentPageHeader from './CurrentPageHeader';
import MessagesNode from './Messages/MessagesNode';
import ServicePage from './Services/ServicePage';
import { useMediaQuery } from 'react-responsive';
import { Spinner } from '@dartfrog/puddle';

interface MiddleProps {
}

export const renderLoading = () => {
    return (
      <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection:"column",
        justifyContent: "center",
        alignItems: "center",
        gap:"1rem",
        color:"gray",
        userSelect:"none",
      }}
    >
      <div>
        loading...
      </div>
      <Spinner />
    </div>
    )
  }
const Middle: React.FC<MiddleProps> = ({ }) => {
  const { isSidebarOpen, isClientConnected } = useDartStore();
  const isMobile = useMediaQuery({ maxWidth: 767 });

  const renderPage = (page, isLoaded) => {
    return (
      <div
      style={{
        height: "100%",
        maxHeight: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CurrentPageHeader />
      {!isLoaded ? (
        renderLoading()
      ) : (
        page()
      )}
    </div>

    )
  }

  const content = (
    <div
      style={{
        height: "100%",
        maxHeight: "100%",
        overflowY: 'hidden',
      }}
    >
      <Routes>
        <Route path="/" element={
            renderPage(() => <Home />, isClientConnected)
        } />
        <Route path="/services" element={
            renderPage(() => <Services />, isClientConnected)
        } />
        <Route path="/services/:id" element={
            renderPage(() => <ServicePage />, isClientConnected)
        } />
        <Route path="/messages" element={
            renderPage(() => <Messages />, isClientConnected)
        } />
        <Route path="/messages/:node" element={
            renderPage(() => <MessagesNode />, isClientConnected)
        } />
        <Route path="/nodes" element={
            renderPage(() => <Nodes />, isClientConnected)
        } />
        <Route path="/nodes/:node" element={
            renderPage(() => <NodeProfile />, isClientConnected)
        } />
        <Route path="/join/:id" element={
            renderPage(() => <JoinPage />, isClientConnected)
        } />
      </Routes>
    </div>
  );

  if (isMobile) {
    return (
      <div style={{
        height: '100%',
        flexGrow: 1,
        maxHeight: '100%',
        overflowY: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {content}
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      flexGrow: 1,
      maxHeight: '100%',
      overflowY: 'hidden',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }}>
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
          height:"100%",
          maxHeight:"100%",
          overflowY: 'hidden',
        }}
      >
        {content}
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