import DisplayUserActivity from "./DisplayUserActivity";
import useChatStore from "../store/chat";

import ChatBox from "./ChatBox";
import ChatHeader from "./ChatHeader";
import { Service, ServiceConnectionStatus, ServiceConnectionStatusType, ServiceId, makeServiceId } from "../dartclientlib";
import ChatInput from "./ChatInput";

interface ServiceTabProps {
  serviceId: ServiceId;
}

const ServiceTab: React.FC<ServiceTabProps> = ({ serviceId }) => {

  const {chats} = useChatStore();
  return (
    <div
      style={{
        minHeight: "400px",
        padding: "4px",
      }}
    >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.3rem",
          }}
        >
          <div>{serviceId}</div>
          <ChatHeader
            />
          <ChatBox chats={chats} />
          {/* <ChatInput /> */}
        </div>

    </div>
  );
}


export default ServiceTab;

function formatTimeStamp(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString();
}
