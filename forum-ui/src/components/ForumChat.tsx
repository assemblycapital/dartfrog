import ChatBox from "@dartfrog/puddle/components/ChatBox";
import DisplayUserActivity from "@dartfrog/puddle/components/DisplayUserActivity";
import useChatStore from "@dartfrog/puddle/store/chat";
import { useNavigate } from "react-router-dom";
import ForumHeader from "./ForumHeader";

const ForumChat: React.FC = () => {
  const {chatState,serviceId, serviceMetadata} = useChatStore();
  const navigate = useNavigate();

  return (
    <div
      style={{
        display:"flex",
        flexDirection:"column",
        height:"100%",
        maxHeight:"100%",
      }}

    >
      <ForumHeader includeForumButton={true} />
      <ChatBox chatState={chatState} />
      <DisplayUserActivity metadata={serviceMetadata} />
    </div>
    
  )
}

export default ForumChat;