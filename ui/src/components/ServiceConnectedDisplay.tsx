import React, { useEffect, useRef, useState } from 'react';
import Piano from './Piano/Piano';
import DisplayUserActivity from './DisplayUserActivity';
import ServiceConnectedRow from './ServiceConnectedRow';
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
      const minHeight = 200;
      if (newHeight < minHeight) newHeight = minHeight;
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
       
        <ServiceConnectedRow serviceId={serviceId} service={service} plugins={plugins} />
        <div
          style={{
            height: '8px',
            background: '#1f1f1f',
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
