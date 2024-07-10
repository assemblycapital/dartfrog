import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
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

  const navigate = useNavigate();

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
          // TODO also check access settings
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

  
  function pluginToSubdomain(plugin:string) {
    let parts = plugin.split(":");
    let pkg = parts.slice(1).join(":")

    return pkg.replace(/[.:]/g, '-');
  }

  function getPackageName(plugin) {
      const pluginParts = plugin.split(":")
      if (pluginParts.length !== 3)  {
        return null
      }

      return pluginParts.slice(1).join(":");
  }

  useEffect(() => {
    if (serviceStatus === ServiceStatus.PLUGIN_READY && serviceMetadata) {
      const plugin = serviceMetadata.plugin;
      const packageName = getPackageName(plugin)
      if (packageName !== "dartfrog:herobrine.os") {
        let url = `http://${baseOrigin}/${plugin}/?service=${serviceId}`;
        window.location.replace(url);

      }
      const packageSubdomain = pluginToSubdomain(plugin)
      let url = `http://${packageSubdomain}.${baseOrigin}/${plugin}/?service=${serviceId}`;
      window.location.replace(url);
    }
  }, [serviceStatus, serviceMetadata, baseOrigin, serviceId]);

  function renderServiceStatus(status) {
    if (!(status)) {
      return "loading";
    }

    if (status == ServiceStatus.PLUGIN_NOT_INSTALLED) {

      const packageName = getPackageName(serviceMetadata.plugin)
      if (!(packageName)) return "weird package name"

      return (
        <div>
          <div>
            {serviceMetadata.plugin} is not installed.
            
          </div>
          <div>
            <a href={`http://${baseOrigin}/main:app_store:sys/app-details/${packageName}`}>
              go to {packageName} in the app store
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
              open {serviceId}
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
        height:'100%',
        gap: "0.4rem",
      }}
    >
        <div>
          <div
            className='home-link' 
            style={{
              display:"inline-block",
              fontSize:"0.8rem",
              padding: "0.2rem 0.6rem"
            }}
            onClick={() => navigate('/')}
          >
            <span>home</span>
          </div>

        </div>
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