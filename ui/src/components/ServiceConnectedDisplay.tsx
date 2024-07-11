import React, { useEffect, useRef, useState } from 'react';
import DisplayUserActivity from './DisplayUserActivity';
import ServiceConnectedRow from './ServiceConnectedRow';
import "./ServiceConnectedDisplay.css"


const ServiceConnectedDisplay = ({ serviceId, service, addTab }) => {
  const [plugins, setPlugins] = useState([]);
  useEffect(() => {
    const activePlugins = service.metadata.plugins;
    setPlugins(activePlugins);
  }, [service, serviceId]);


  return (
    <div
      className="service-column"
      >
        {/* <ServiceConnectedRow serviceId={serviceId} service={service} plugins={plugins} addTab={addTab} /> */}
        {/* <DisplayUserActivity serviceId={serviceId} metadata={service.metadata} /> */}
    </div>
  );
};

export default ServiceConnectedDisplay;
