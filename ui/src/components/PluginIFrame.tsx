import React from 'react';
// import { ServiceId, Service } from '@dartfrog/puddle';
import useDartStore, { STANDARD_PLUGINS } from '../store/dart';
import './PluginIFrame.css';

interface PluginIFrameProps {
  // serviceId: ServiceId,
  // service: Service,
  // plugin: string,
  // addTab: (serviceId: ServiceId | null) => void;
}


const PluginIFrame: React.FC<PluginIFrameProps> = ({}) => {
  const [isThirdParty, setIsThirdParty] = React.useState(true);

  // const {setAuthDialog, setIsAuthDialogActive, authDialog} = useDartStore();
// 
  let baseOrigin = window.location.origin.split(".").slice(1).join(".");

  // React.useEffect(()=> {
  //   setIsThirdParty(!(STANDARD_PLUGINS.includes(plugin)))
  // }, [plugin])

  // React.useEffect(() => {
  //   const checkPluginAvailability = async () => {
      // try {
      //   const response = await fetch(`/${plugin}/?service=${serviceId}`);
      //   if (!response.ok) {
      //     setPluginStatus(PLUGIN_NOT_INSTALLED);
      //   } else {
      //     console.log("response ok", response)
      //     setPluginStatus(PLUGIN_READY);
      //   }
      // } catch (error) {
      //   if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      //     // This is likely a CORS error
      //     setPluginStatus(PLUGIN_SECURE_SUBDOMAIN);
      //   } else {
      //     // ??
      //     setPluginStatus(PLUGIN_NOT_INSTALLED);
      //   }
      // }
    // };
  //   checkPluginAvailability();
  // }, [isThirdParty]);

  React.useEffect(() => {
    const messageListener = (event: MessageEvent) => {
      if (event.data.type === 'open-df-service') {
        const dialogKey = 'dialogShown-' + event.data.url;
        if (!sessionStorage.getItem(dialogKey)) {
          let confirmed = window.confirm(`Open ${event.data.url}?`);
          sessionStorage.setItem(dialogKey, 'true');
          if (confirmed) {
            let serviceId = event.data.url.slice(5, event.data.url.length);
            // addTab(serviceId);
          }
          setTimeout(() => {
            sessionStorage.removeItem(dialogKey);
          }, 500);
        }
      } else if (event.data.type === 'open-http-url') {
        const dialogKey = 'dialogShown-' + event.data.url;
        if (!sessionStorage.getItem(dialogKey)) {
          let confirmed = window.confirm(`Open ${event.data.url}?`);
          sessionStorage.setItem(dialogKey, 'true');
          if (confirmed) {
            window.open(event.data.url, '_blank');
          }
          setTimeout(() => {
            sessionStorage.removeItem(dialogKey);
          }, 500);
        }
      }
    };

    window.addEventListener('message', messageListener);

    return () => {
      window.removeEventListener('message', messageListener);
    };
  }, []);


  if (isThirdParty) {
      return (
        <div>
          {/* <a href={`http://${baseOrigin}/${plugin}/?service=${serviceId}`} target="_blank" rel="noopener noreferrer"> */}
          <div
            className="open-secure-subdomain-link"
          >
            {/* open {plugin} in a new tab */}
          </div>
          {/* </a> */}
        </div>

      )
  }

  return (
    <iframe 
      // src={`/${plugin}/?service=${serviceId}`} 
      // title={plugin}
    />
  );
};


export default PluginIFrame;