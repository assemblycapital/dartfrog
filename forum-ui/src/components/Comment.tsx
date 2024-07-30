import { getPeerNameColor, getRecencyText, nodeProfileLink } from "@dartfrog/puddle";
import ProfilePicture from "@dartfrog/puddle/components/ProfilePicture";
import useChatStore from "@dartfrog/puddle/store/chat";
import { ForumComment } from "../store/forum";
import { BASE_ORIGIN } from "../utils";

const Comment: React.FC<{ comment: ForumComment }> = ({ comment }) => {

  const { api, peerMap } = useChatStore();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "0.8rem",
      }}
      className="hover-dark-gray"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "10px",
          alignItems: "center",
          fontSize: "0.9rem",
        }}
      >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "10px",
              alignItems: "center",
            }}
          >
            
            <a
              href={nodeProfileLink(comment.author, BASE_ORIGIN)}
              style={{ display: "flex", alignItems: "center" }}
            >
              <ProfilePicture size="25px" node={comment.author} />
            </a>

            <a
              href={nodeProfileLink(comment.author, BASE_ORIGIN)}
            >
              <span className={getPeerNameColor(peerMap.get(comment.author))}>
                {comment.author}
              </span>
            </a>
          </div>
        <span
          style={{
            fontSize: "0.7rem",
            color: 'gray',
          }}
        >
          {getRecencyText(Date.now() - comment.created_at * 1000)}
        </span>
      </div>
      <div
        style={{
          fontSize:"0.8rem",
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          marginTop:"5px"
          // WebkitLineClamp: 2,
          // WebkitBoxOrient: 'vertical',
        }}
      >
        {comment.text}
      </div>
  </div>
);
}

export default Comment;