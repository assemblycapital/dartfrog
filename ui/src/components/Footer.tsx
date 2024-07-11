import { useEffect, useState } from "react";
import { AssemblyCapitalLogo } from "./icons/Icons";
import { ConnectionStatusType, ServiceConnectionStatusType } from "@dartfrog/puddle/index";
import useDartStore from "../store/dart";
import DisplayUserActivity from "./DisplayUserActivity";

const Footer = () => {

  const {  } = useDartStore();

  // useEffect(() => {
  //   let tab = tabs[activeTabIndex];
  //   if (tab) {
  //     setServiceId(tab.serviceId);
  //   }
  // }, [tabs, activeTabIndex]);

  // useEffect(() => {
  //   if (!(services instanceof Map)) return;
  //   const gotService = services.get(serviceId);
  //   if (gotService) {
  //     setService({ ...gotService });
  //   } else {
  //     setService(null);
  //   }
  // }, [services, serviceId]);

  // if (serviceId !== null && (service !== null && service.connectionStatus.status === ServiceConnectionStatusType.Connected)) {
  //   return (
  //     <>
  //       <DisplayUserActivity serviceId={serviceId} metadata={service?.metadata}/>
  //     </>
  //   )
  // }

  return (
    <div
      style={{
      display: "flex",
      flexDirection: "column",
          fontSize: "0.8rem",
          color: "#ffffff44",
      gap: "0.8rem",
      userSelect: "none",
      }}
      >

      <div
        style={{
          fontSize: "0.8rem",
          color: "#ffffff44",
          cursor: "default",
          display: "flex",
          flexDirection: "row",
          gap: "1rem",
        }}
      >
      <div
        style={{
          display: "inline-block",
          alignContent: "flex-end",
          opacity: "0.2",
        }}
      >
        <AssemblyCapitalLogo width="24" height="24" color="white"/>
      </div>

        <span
          style={{
            alignContent: "center",
          }}
        >
          For help, contact a.cow on Discord.
          If you're having trouble, you may need to update your app version or uninstall and reinstall the app.
        </span>
      </div>
    </div>

  );
}
export default Footer;