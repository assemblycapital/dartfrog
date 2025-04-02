import React from 'react';
// import { ServiceId, Service } from '@dartfrog/puddle';
import PluginIFrame from './PluginIFrame';
import Split from 'react-split';

interface ServiceConnectedRowProps {
    // serviceId: ServiceId,
    // service: Service,
    // plugins: string[]
    // addTab: (serviceId: ServiceId | null) => void;
}

const ServiceConnectedRow: React.FC<ServiceConnectedRowProps> = ({}) => {
  const CHAT_PLUGIN = "chat:dartfrog:gliderlabs.os";
  const PIANO_PLUGIN = "piano:dartfrog:gliderlabs.os";

  // Function to render plugins based on count
  // const renderPlugins = () => {
  //   if (plugins.length === 0) {
  //     return (
  //       <div style={{ 
  //         justifyContent: 'center', 
  //         alignItems: 'center', 
  //         height: '100%', 
  //         width: '100%', 
  //         textAlign: 'center',
  //         display: 'flex',
  //         flexDirection: 'column',
  //       }}>
  //         <div>
  //         No plugins available

  //         </div>
  //       </div>
  //     );
  //   } else if (plugins.length === 1) {
  //     return (
  //       <div className="plugin-wrapper">
  //         <PluginIFrame
  //           service={service}
  //           serviceId={serviceId}
  //           plugin={plugins[0]}
  //           addTab={addTab}
  //         />
  //       </div>
  //     );
  //   } else if (plugins.length === 2) {
  //     const nonChatPlugin = plugins.find(plugin => plugin !== CHAT_PLUGIN) || plugins[0];
  //     const [firstPlugin, secondPlugin] = plugins.includes(CHAT_PLUGIN)
  //       ? [nonChatPlugin, CHAT_PLUGIN]
  //       : plugins;

  //     return (
  //         <>
  //         <Split
  //           sizes={[50, 50]}
  //           minSize={60}
  //           direction="horizontal"
  //           style={{ display: 'flex', width: '100%', height: '100%'}}
  //         >
  //           <div className="plugin-wrapper">
  //             <PluginIFrame
  //               service={service}
  //               serviceId={serviceId}
  //               plugin={firstPlugin}
  //               addTab={addTab}
  //             />
  //           </div>
  //           <div className="plugin-wrapper">
  //             <PluginIFrame
  //               service={service}
  //               serviceId={serviceId}
  //               plugin={secondPlugin}
  //               addTab={addTab}
  //             />
  //           </div>
  //     </Split>
  //       </>
  //     );
  //   } else {
  //     return (
  //       <div style={{ 
  //         justifyContent: 'center', 
  //         alignItems: 'center', 
  //         height: '100%', 
  //         width: '100%', 
  //         textAlign: 'center',
  //         display: 'flex',
  //         flexDirection: 'column',
  //         gap: '0.8rem'
  //       }}>
  //         <div>
  //           cant display more than two plugins
  //         </div>
  //         <div>
  //           {plugins.map((plugin) => (
  //             <div>
  //               <a href={`/${plugin}/?service=${serviceId}`} target="_blank" rel="noopener noreferrer">
  //                 /{plugin}/?service={serviceId}
  //               </a>
  //             </div>
  //           ))}
  //         </div>
  //       </div>
  //     );
  //   }
  // };

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
      {/* {renderPlugins()} */}
    </div>
  );
};

export default ServiceConnectedRow;
