import useChatStore from "@dartfrog/puddle/store/chat";
import useForumStore from "../store/forum";
import { useNavigate } from "react-router-dom";

interface ForumHeaderProps {
  includeForumButton?: boolean;
}

const ForumHeader: React.FC<ForumHeaderProps> = ({ includeForumButton = false }) => {
  const { serviceId } = useChatStore();
  const {title, description} = useForumStore();
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "1.3rem",
        margin: "1rem 0rem",
        alignItems: "flex-end"
      }}
    >
      {includeForumButton && (
        <button
          style={{
            width: 'auto',
            height: 'auto',
            padding: '0.5rem 1rem',
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
    </div>
  )
}

export default ForumHeader;