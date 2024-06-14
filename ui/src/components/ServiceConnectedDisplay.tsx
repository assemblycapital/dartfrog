import React, { useEffect, useState } from 'react';
import ChatHeader from './ChatHeader';
import ChatBox from './ChatBox';
import Piano from './Piano/Piano';
import DisplayUserActivity from './DisplayUserActivity';

const ServiceConnectedDisplay = ({ serviceId, service }) => {
  const [plugins, setPlugins] = useState([]);

  useEffect(() => {
    const activePlugins = service.metadata.plugins.filter(
      (plugin) => service.pluginStates[plugin] && service.pluginStates[plugin].exists && service.pluginStates[plugin].state
    );
    setPlugins(activePlugins);
  }, [service, serviceId]);

  const renderPlugin = (pluginName) => {
    if (!service.pluginStates[pluginName] || !service.pluginStates[pluginName].state) {
      return <div>{`${pluginName} plugin not available or not initialized`}</div>;
    }

    switch (pluginName) {
      case 'chat':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <ChatHeader serviceId={serviceId} />
            <ChatBox serviceId={serviceId} chatState={service.pluginStates.chat.state} />
          </div>
        );
      case 'piano':
        return <Piano serviceId={serviceId} pianoState={service.pluginStates.piano.state} />;
      default:
        return <div>{`${pluginName} plugin not available`}</div>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem' }}>
        {plugins.length === 0 && <div>No plugins available</div>}
        {plugins.length === 1 && (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            {renderPlugin(plugins[0])}
          </div>
        )}
        {plugins.length === 2 && (
          <>
            <div style={{ flex: 1 }}>
              {renderPlugin(plugins.find((plugin) => plugin !== 'chat') || plugins[0])}
            </div>
            <div style={{ flex: 1 }}>
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
