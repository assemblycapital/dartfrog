import React, { useEffect, useState } from 'react';
import Piano from './Piano/Piano';
import DisplayUserActivity from './DisplayUserActivity';
import PagePluginBox from './PagePluginBox';
import "./ServiceConnectedDisplay.css"
import ChessPluginBox from './ChessPluginBox';

const ServiceConnectedDisplay = ({ serviceId, service }) => {
  const [plugins, setPlugins] = useState([]);

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
  return (
    <div
      className="service-column"
      >

      <div
        className="service-row"
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
      </div>

      <DisplayUserActivity serviceId={serviceId} metadata={service.metadata} />
    </div>
  );
};

export default ServiceConnectedDisplay;
