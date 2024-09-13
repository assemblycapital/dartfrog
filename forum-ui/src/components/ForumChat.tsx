import { useNavigate } from "react-router-dom";
import ForumHeader from "./ForumHeader";
import { useServiceStore, ChatBox, DisplayUserActivity} from "@dartfrog/puddle";

const ForumChat: React.FC = () => {
  const {chatState,serviceId, serviceMetadata} = useServiceStore();
  const navigate = useNavigate();

  return (
    <div
      style={{
        display:"flex",
        flexDirection:"column",
        height:"100%",
        maxHeight:"100%",
        overflow:"hidden",
      }}

    >
      <ChatBox chatState={chatState} />
      <DisplayUserActivity metadata={serviceMetadata} />
    </div>
    
  )
}

export default ForumChat;