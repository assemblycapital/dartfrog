import DisplayUserActivity from "./DisplayUserActivity";
import useChatStore from "../store/chat_old";

import ChatBox from "./ChatBox";
import ChatHeader from "./ChatHeader";
import { ConnectionStatusType, ServerStatus } from "../types/types";
import { useEffect } from "react";
import Spinner from "./Spinner";
import useDartStore from "../store/dart";
import { ServiceConnectionStatus, ServiceConnectionStatusType } from "../dartclientlib";
import OpenServiceTab from "./ServiceTab";
import TabbedWindowManager from "./TabbedWindowManager";

function BrowserBox() {
  const { services, exitService, joinService, availableServices, closeApi } = useDartStore();
  // const { chats, serverStatus } = useChatStore();
  if (!(services instanceof Map)) {
    // this is pretty dumb
    // but if i dont do it, everything explodes :)
    return <Spinner />
  }
  if (!(availableServices instanceof Map)) {
    // this is pretty dumb
    // but if i dont do it, everything explodes :)
    return <Spinner />
  }


  return (
    <div>
        <TabbedWindowManager />
    </div>
  );
}


export default BrowserBox;

function formatTimeStamp(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString();
}
