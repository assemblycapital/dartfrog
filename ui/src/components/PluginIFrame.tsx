import React from 'react';
import { ServiceId, Service } from '@dartfrog/puddle';


interface PluginIFrameProps {
  serviceId: ServiceId,
  service: Service,
  plugin: string,
}

const PluginIFrame: React.FC<PluginIFrameProps> = ({serviceId, service, plugin}) => {
  const [isPluginAvailable, setIsPluginAvailable] = React.useState(true);

  React.useEffect(() => {
    const checkPluginAvailability = async () => {
      try {
        const response = await fetch(`/${plugin}/?service=${serviceId}`);
        if (!response.ok) throw new Error('Plugin not found');
      } catch (error) {
        console.log(error);
        setIsPluginAvailable(false);
      }
    };

    checkPluginAvailability();
  }, [plugin, serviceId]);

  if (!isPluginAvailable) {
    let [process, packageName, node] = plugin.split(":");
    let fullPackageName = `${packageName}:${node}`;
    return <div>
      <div>

      Plugin not found...
      </div>
      <div>
        You may need to install <a href="/main:app_store:sys/app-details/{fullPackageName}">{fullPackageName}</a> from the app store.
      </div>
      </div>;
  }

  return (
    <iframe 
      src={`/${plugin}/?service=${serviceId}`} 
      title={plugin}
    />
  );
};

export default PluginIFrame;