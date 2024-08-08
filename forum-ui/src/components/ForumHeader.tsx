import useChatStore from "@dartfrog/puddle/store/chat";
import useForumStore from "../store/forum";
import { useNavigate } from "react-router-dom";

interface ForumHeaderProps {
  includeForumButton?: boolean;
}

const ForumHeader: React.FC<ForumHeaderProps> = ({ includeForumButton = false }) => {
  const { serviceId, serviceMetadata} = useChatStore();
  const {title, description} = useForumStore();
  const navigate = useNavigate();

  const renderOnlineCountMessage = () => {
    if (!serviceMetadata) {
      return <div />
    }

    if (serviceMetadata.subscriber_count) {
        return (
          <div
            style={{
              fontSize: "0.8rem",
              color: 'gray',
            }}
          >
            {serviceMetadata.subscriber_count} online
          </div>
        )
    }

    if (serviceMetadata.subscribers) {
        return (
          <div
            style={{
              fontSize: "0.8rem",
              color: 'gray',
            }}
          >
            {serviceMetadata.subscribers.length} online
          </div>
        )
    }

    return <div></div>;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "1rem",
        height:"32px",
        marginBottom:"0.8rem",
        boxSizing:"border-box",
      }}
      >
        {includeForumButton && (
        <button
          style={{
            width: 'auto',
            height: 'auto',
            // padding: '0.5rem 1rem',
          }}
          onClick={() => {
            navigate(`/df/service/${serviceId}/forum`)
          }}
        >
          forum
        </button>
      )}
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "1.3rem",
        alignItems: "flex-end",
        paddingBottom:"3px",
      }}
    >
      
      <div
        style={{
          fontWeight: "bold",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "0.8rem",
        }}
      >
        {description}
      </div>
      {renderOnlineCountMessage()}
    </div>
    </div>
  )
}

export default ForumHeader;