import React from 'react';
import { ServiceId, Service } from '@dartfrog/puddle';

interface PluginIFrameProps {
  serviceId: ServiceId,
  service: Service,
  plugin: string,
  addTab: (serviceId: ServiceId | null) => void;
}


const PluginIFrame: React.FC<PluginIFrameProps> = ({serviceId, service, plugin, addTab}) => {
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

  React.useEffect(() => {
    const messageListener = (event: MessageEvent) => {
      if (event.data.type === 'open-df-service') {
        const dialogKey = 'dialogShown-' + event.data.url;
        if (!sessionStorage.getItem(dialogKey)) {
          let confirmed = window.confirm(`Open ${event.data.url}?`);
          sessionStorage.setItem(dialogKey, 'true'); // Set flag in session storage
          if (confirmed) {
            let serviceId = event.data.url.slice(5, event.data.url.length);
            addTab(serviceId);
          }
          setTimeout(() => {
            sessionStorage.removeItem(dialogKey); // Remove flag after a delay
          }, 500); // Delay of 5000 milliseconds (5 seconds)
        }
      } else if (event.data.type === 'open-http-url') {
        const dialogKey = 'dialogShown-' + event.data.url;
        if (!sessionStorage.getItem(dialogKey)) {
          let confirmed = window.confirm(`Open ${event.data.url}?`);
          sessionStorage.setItem(dialogKey, 'true'); // Set flag in session storage
          if (confirmed) {
            window.open(event.data.url, '_blank');
          }
          setTimeout(() => {
            sessionStorage.removeItem(dialogKey); // Remove flag after a delay
          }, 500); // Delay of 5000 milliseconds (5 seconds)
        }
      }
    };

    window.addEventListener('message', messageListener);

    return () => {
      window.removeEventListener('message', messageListener);
    };
  }, []);

  if (!isPluginAvailable) {
    let [process, packageName, node] = plugin.split(":");
    let fullPackageName = `${packageName}:${node}`;
    return (
      <div>
        <div>{plugin} not found...</div>
        <div>
          You may need to install <a href={`/main:app_store:sys/app-details/${fullPackageName}`}>{fullPackageName}</a> from the app store.
        </div>
      </div>
    );
  }

  return (
    <iframe 
      src={`/${plugin}/?service=${serviceId}`} 
      title={plugin}
    />
  );
};

export default PluginIFrame;
