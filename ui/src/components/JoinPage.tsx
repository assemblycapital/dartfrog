import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import useDartStore from '../store/dart';
import { ServiceID, ServiceMetadata } from '@dartfrog/puddle/index';
// import { Service, ServiceMetadata, parseServiceId } from '@dartfrog/puddle/index';

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

  const serviceIdString = id;

  const serviceId = ServiceID.fromString(serviceIdString);
  const {peerMap, localServices, localFwdPeerRequest} = useDartStore();

  const [serviceMetadata, setServiceMetadata] = useState<ServiceMetadata | null>(null)
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);


  const navigate = useNavigate();

  let baseOrigin = window.location.origin.split(".").slice(1).join(".");
  useEffect(()=> {
    if (!(peerMap instanceof Map)) {
      return
    }
    if (!serviceId) {
      setServiceStatus(ServiceStatus.INVALID_SERVICE_ID)
      return;
    }

    let gotService = null;
    if (serviceId.hostNode() === window.our?.node) {

      console.log("our")
      gotService = localServices.find(service => service.id.toString() === serviceId.toString());

    } else {
      console.log("not our")
      let gotPeer = peerMap.get(serviceId.hostNode());
      if (!(gotPeer)) {
        console.log("no peer")
        // TODO
        localFwdPeerRequest(serviceId.hostNode());
        setServiceStatus(ServiceStatus.CONTACTING_HOST)
        return;
      }
      if (!(gotPeer.peerData)) {
        console.log("no peer data")
        setServiceStatus(ServiceStatus.CONTACTING_HOST)
        return;
      }
      console.log("got peer data", gotPeer.peerData.hostedServices, serviceId)
      gotService = gotPeer.peerData.hostedServices.find(service => service.id.toString() === serviceId.toString());
      console.log("got service", gotService);

    }


    if (!(gotService)) {
      setServiceStatus(ServiceStatus.SERVICE_DOES_NOT_EXIST);
      // setTimeout(() => {
      //   requestServiceList(parsedServiceId.node);
      // }, 300);
      return;
    }

    setServiceMetadata(gotService.meta);

    setServiceStatus(ServiceStatus.CHECKING_PLUGIN)

    const checkProcessAvailability = async () => {
      const process = gotService.id.process();
      try {
        const response = await fetch(`/${process}/?service=${serviceId}`);
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
    checkProcessAvailability();

  }, [peerMap, localServices])

  
  function processToSubdomain(process:string) {
    let parts = process.split(":");
    let pkg = parts.slice(1).join(":")

    return pkg.replace(/[.:]/g, '-');
  }

  function getPackageName(process:string) {
      const processParts = process.split(":")
      if (processParts.length !== 3)  {
        return null
      }

      return processParts.slice(1).join(":");
  }

  useEffect(() => {
    if (serviceStatus === ServiceStatus.PLUGIN_READY && serviceMetadata) {
      const process = serviceId.process();
      const packageName = getPackageName(process)
      if (packageName !== "dartfrog:herobrine.os") {
        let url = `http://${baseOrigin}/${process}/df/service/${serviceId}`;
        window.location.replace(url);

      }
      const packageSubdomain = processToSubdomain(process)
      let url = `http://${packageSubdomain}.${baseOrigin}/${process}/df/service/${serviceId}`;
      window.location.replace(url);
    }
  }, [serviceStatus, serviceMetadata, baseOrigin, serviceId]);

  const renderServiceStatus = useCallback((status) => {
    if (!(status)) {
      return "loading";
    }

    if (status == ServiceStatus.PLUGIN_NOT_INSTALLED) {

      const packageName = getPackageName(serviceId.process())
      if (!(packageName)) return "weird package name"

      return (
        <div>
          <div>
            {serviceId.process()} is not installed.
            
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
      let process = serviceId.process();
      return (
          <div>
            <a href={`http://${baseOrigin}/${process}/df/service/${serviceId}`} target="_blank" rel="noopener noreferrer">
            <div
              className="open-secure-subdomain-link"
            >
              open {serviceIdString}
            </div>
            </a>

          </div>
      )
    }
    return status;

  }, [serviceId, serviceMetadata])

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
          {serviceIdString}
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