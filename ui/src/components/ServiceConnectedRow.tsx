import React from 'react';
import { ServiceId, Service } from '@dartfrog/puddle';
import PluginIFrame from './PluginIFrame';

interface ServiceConnectedRowProps {
    serviceId: ServiceId,
    service: Service,
    plugins: string[]
    addTab: (serviceId: ServiceId | null) => void;
}

const ServiceConnectedRow: React.FC<ServiceConnectedRowProps> = ({serviceId, service, plugins, addTab}) => {
  const CHAT_PLUGIN = "chat:dartfrog:herobrine.os";
  const PIANO_PLUGIN = "piano:dartfrog:herobrine.os";

  // Function to render plugins based on count
  const renderPlugins = () => {
    if (plugins.length === 0) {
      return <div>No plugins available</div>;
    } else if (plugins.length === 1) {
      return (
        <div className="plugin-wrapper">
          <PluginIFrame
            service={service}
            serviceId={serviceId}
            plugin={plugins[0]}
            addTab={addTab}
          />
        </div>
      );
    } else if (plugins.length === 2) {

      const nonChatPlugin = plugins.find(plugin => plugin !== CHAT_PLUGIN) || plugins[0];
      return (
          <>
          <div className="plugin-wrapper">
            <PluginIFrame
              service={service}
              serviceId={serviceId}
              plugin={nonChatPlugin}
              addTab={addTab}
            />
          </div>
          <div className="plugin-wrapper">
            <PluginIFrame
              service={service}
              serviceId={serviceId}
              plugin={CHAT_PLUGIN}
              addTab={addTab}
            />
          </div>
        </>
      );
    } else {
      return <div>Support for more than two plugins is not available</div>;
    }
  };

  let flexDirection: React.CSSProperties['flexDirection'] = "row";
  // if (plugins.length === 2) {
  //   const nonChatPlugin = plugins.find(plugin => plugin !== CHAT_PLUGIN) || plugins[0];
  //   const isPianoPlugin = nonChatPlugin === PIANO_PLUGIN;
  //   flexDirection = isPianoPlugin ? "column" : "row";
  // }
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: flexDirection,
        gap: "0.8rem"
      }}
    >
      {renderPlugins()}
    </div>
  );
};

export default ServiceConnectedRow;
