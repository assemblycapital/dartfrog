import React, { useEffect, useState } from 'react';
import ChatHeader from './ChatHeader';
import ChatBox from './ChatBox';
import Piano from './Piano/Piano';
import DisplayUserActivity from './DisplayUserActivity';
import PagePluginBox from './PagePluginBox';
import "./ServiceConnectedDisplay.css"
import ChessPluginBox from './ChessPluginBox';

const ServiceConnectedDisplay = ({ serviceId, service }) => {
  const [plugins, setPlugins] = useState([]);

  useEffect(() => {
    const activePlugins = service.metadata.plugins.filter(
      plugin => service.pluginStates[plugin] && service.pluginStates[plugin].exists
    );
    setPlugins(activePlugins);
  }, [service, serviceId]);

  const renderPlugin = (pluginName) => {
    if (!service.pluginStates[pluginName] || !service.pluginStates[pluginName]) {
      return <div>{`${pluginName} plugin not available or not initialized`}</div>;
    }

    return (
      <div
        style={{
          fontSize: '0.8rem',
          color: '#ffffff88'
        }}
      >
        <div>
          {pluginName}
        </div>
        <iframe 
          src={`/${pluginName}?service=${serviceId}`} 
          style={{ border: "none", width: '100%', height: '100%' }} 
          title={pluginName}
        />
      </div>
    )
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.3rem' }}>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: '0.8rem', height: '100%' }}>
        {plugins.length === 0 && <div>No plugins available</div>}
        {plugins.length === 1 && (
          <div style={{ flex: 1, display: 'flex', height: '100%' }}>
            {renderPlugin(plugins[0])}
          </div>
        )}
        {plugins.length === 2 && (
          <>
            <div 
              className="plugin-wrapper"
            >
              {renderPlugin(plugins.find(plugin => plugin !== 'chat') || plugins[0])}
            </div>
            <div 
              className="plugin-wrapper"
            >
              {renderPlugin('chat')}
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
