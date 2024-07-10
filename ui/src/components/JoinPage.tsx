import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import useDartStore from '../store/dart';
import { Service, ServiceMetadata, parseServiceId } from '@dartfrog/puddle/index';

enum ServiceStatus {
  INVALID_SERVICE_ID = "invalid service id",
  CONTACTING_HOST = "contacting host...",
  SERVICE_DOES_NOT_EXIST = "service doesn't exist...",
  CHECKING_PLUGIN = "checking plugin",
  PLUGIN_NOT_INSTALLED = "plugin not installed",
  PLUGIN_READY = "plugin ready",
  PLUGIN_SECURE_SUBDOMAIN = "plugin secure subdomain",
  PLUGIN_ISSUE = "plugin issue?"
}

const JoinPage = () => {
  const { id } = useParams<{ id: string }>();

  const serviceId = id;

  
  const {availableServices, requestServiceList} = useDartStore();

  const [serviceMetadata, setServiceMetadata] = useState<ServiceMetadata | null>(null)
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);

  const parsedServiceId = parseServiceId(serviceId)

  let baseOrigin = window.location.origin.split(".").slice(1).join(".");
  useEffect(()=> {
    if (!(availableServices instanceof Map)) {
      return
    }
    if (!parsedServiceId) {
      setServiceStatus(ServiceStatus.INVALID_SERVICE_ID)
      return;
    }

    let gotServices = availableServices.get(parsedServiceId.node);
    if (!(gotServices)) {
      requestServiceList(parsedServiceId.node);
      setServiceStatus(ServiceStatus.CONTACTING_HOST)
      return;
    }

    let gotService = gotServices.get(serviceId)
    if (!(gotService)) {
      setServiceStatus(ServiceStatus.SERVICE_DOES_NOT_EXIST);
      setTimeout(() => {
        requestServiceList(parsedServiceId.node);
      }, 300);
      return;
    }

    setServiceMetadata(gotService);

    setServiceStatus(ServiceStatus.CHECKING_PLUGIN)

    const checkPluginAvailability = async () => {
      try {
        const response = await fetch(`/${gotService.plugin}/?service=${serviceId}`);
        if (!response.ok) {
          setServiceStatus(ServiceStatus.PLUGIN_NOT_INSTALLED)
        } else {
          setServiceStatus(ServiceStatus.PLUGIN_READY)
        }
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          // This is likely a CORS error
          setServiceStatus(ServiceStatus.PLUGIN_SECURE_SUBDOMAIN);
        } else {
          // ??
          setServiceStatus(ServiceStatus.PLUGIN_ISSUE);
        }
      }
    };
    checkPluginAvailability();

  }, [serviceId, availableServices])

  useEffect(() => {
    if (serviceStatus === ServiceStatus.PLUGIN_READY && serviceMetadata) {
      const plugin = serviceMetadata.plugin;
      window.location.href = `http://${baseOrigin}/${plugin}/?service=${serviceId}`;
    }
  }, [serviceStatus, serviceMetadata, baseOrigin, serviceId]);

  function renderServiceStatus(status) {
    if (!(status)) {
      return "loading";
    }

    if (status == ServiceStatus.PLUGIN_NOT_INSTALLED) {
      const pluginParts = serviceMetadata.plugin.split(":")
      if (pluginParts.length !== 3)  {
        return "weird plugin name"
      }

      const packageName = pluginParts.slice(1).join(":");

      return (
        <div>
          <div>
            {serviceMetadata.plugin} is not installed.
            
          </div>
          <div>
            <a href={`http://${baseOrigin}/main:app_store:sys/app-details/${packageName}`}>
              {packageName} in the app store
            </a>
          </div>

        </div>
      )
    }

    if (status == ServiceStatus.PLUGIN_READY) {
      let plugin = serviceMetadata.plugin;
      return (
          <div>
            <a href={`http://${baseOrigin}/${plugin}/?service=${serviceId}`} target="_blank" rel="noopener noreferrer">
            <div
              className="open-secure-subdomain-link"
            >
              open {plugin} in a new tab
            </div>
            </a>

          </div>
      )
    }
    return status;

  }

  return (
    <div
      style={{
        display:"flex",
        flexDirection:"column",
        width:'100%',
        height:'100%'
      }}
    >
      <div
        style={{
          fontSize:"0.8rem",
          backgroundColor:"#333",
          height:"26px",
          display:"flex",
          flexDirection:"row",
          gap:"0.3rem",
          boxSizing:"border-box",
          padding:"3px 10px",
        }}
      >
        <span
          style={{
            color:"gray",
          }}
        >
          joining:
        </span>
        <span
          style={{
          }}
        >
          {serviceId}
        </span>
      </div>

      <div
        style={{
          flex:"1",
          flexGrow:"1",
          display:"flex",
          flexDirection:"column",
          alignContent: "center",
          alignItems: "center",
          justifyContent: "center",
          height:"100%",
        }}
      >
        {renderServiceStatus(serviceStatus)}
      </div>

    </div>
  );
};

export default JoinPage;