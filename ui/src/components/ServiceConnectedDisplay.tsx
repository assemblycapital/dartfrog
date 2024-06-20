import React, { useEffect, useRef, useState } from 'react';
import Piano from './Piano/Piano';
import DisplayUserActivity from './DisplayUserActivity';
import PagePluginBox from './PagePluginBox';
import "./ServiceConnectedDisplay.css"
import ChessPluginBox from './ChessPluginBox';

const ServiceConnectedDisplay = ({ serviceId, service }) => {
  const [plugins, setPlugins] = useState([]);
  const [height, setHeight] = useState(500); // Default height in pixels
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isResizing = useRef(false);

  useEffect(() => {
    const activePlugins = service.metadata.plugins;
    setPlugins(activePlugins);
  }, [service, serviceId]);

  const renderPlugin = (pluginName) => {
    return (
        <iframe 
          src={`/${pluginName}/?service=${serviceId}`} 
          // style={{ border: "none", width: '100%', height: '100%' }} 
          title={pluginName}
        />
    )
  };

  const CHAT_PLUGIN = "chat:dartfrog:herobrine.os";

  const startResizing = (e) => {
    e.preventDefault();
    isResizing.current = true;
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResizing);
    // Disable pointer events on all iframes
    document.querySelectorAll('iframe').forEach(iframe => iframe.style.pointerEvents = 'none');
  };

  const resize = (e) => {
    if (isResizing.current && containerRef.current) {
      const containerTop = containerRef.current.getBoundingClientRect().top;
      let newHeight = e.clientY - containerTop;
      if (newHeight < 100) newHeight = 100; // Ensure minimum height
      setHeight(newHeight);
    }
  };

  const stopResizing = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResizing);
    // Re-enable pointer events on all iframes
    document.querySelectorAll('iframe').forEach(iframe => iframe.style.pointerEvents = '');
  };

  return (
    <div
      className="service-column"
      >
      <div
        ref={containerRef}
        className="service-column"
        style={{ height: `${height}px` }}
        >
        {plugins.length === 0 && <div>No plugins available</div>}
        {plugins.length === 1 && (
          <div
            className="plugin-wrapper"
            > 
            {renderPlugin(plugins[0])}
          </div>
        )}
        {plugins.length === 2 && (
          <>
            <div 
              className="plugin-wrapper"
            >
              {renderPlugin(plugins.find(plugin => plugin !== CHAT_PLUGIN) || plugins[0])}
            </div>
            <div 
              className="plugin-wrapper"
            >
              {renderPlugin(CHAT_PLUGIN)}
            </div>
          </>
        )}
        {plugins.length > 2 && <div>Support for more than two plugins is not available</div>}
        <div
          style={{
            height: '8px',
            background: '#333',
            cursor: 'row-resize',
            width: '100%',
          }}
          onMouseDown={startResizing}
        />
      </div>

      <DisplayUserActivity serviceId={serviceId} metadata={service.metadata} />
    </div>
  );
};

export default ServiceConnectedDisplay;
