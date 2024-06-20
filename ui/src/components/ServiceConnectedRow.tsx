import React from 'react';
import { ServiceId, Service } from '@dartfrog/puddle';
import PluginIFrame from './PluginIFrame';

interface ServiceConnectedRowProps {
    serviceId: ServiceId,
    service: Service,
    plugins: string[]
}

const ServiceConnectedRow: React.FC<ServiceConnectedRowProps> = ({serviceId, service, plugins}) => {
  const CHAT_PLUGIN = "chat:dartfrog:herobrine.os";
  
    return (
        <div
          style={{
            height:"100%",
            display:"flex",
            flexDirection:"row",
            gap: "0.8rem"
          }}
        >
            {plugins.length === 0 && <div>No plugins available</div>}
            {plugins.length === 1 && (
              <div
                className="plugin-wrapper"
                > 
                <PluginIFrame   
                  service={service}
                  serviceId={serviceId}
                  plugin={plugins[0]}
                />
              </div>
            )}
            {plugins.length === 2 && (
              <>
                <div 
                  className="plugin-wrapper"
                >

                <PluginIFrame   
                  service={service}
                  serviceId={serviceId}
                  plugin={plugins.find(plugin => plugin !== CHAT_PLUGIN) || plugins[0]}
                />
                </div>
                <div 
                  className="plugin-wrapper"
                >
                <PluginIFrame   
                  service={service}
                  serviceId={serviceId}
                  plugin={CHAT_PLUGIN}
                />
                </div>
              </>
            )}
            {plugins.length > 2 && <div>Support for more than two plugins is not available</div>}
        </div>
    );
};

export default ServiceConnectedRow;
