import React from 'react';
import { getPeerNameColor, getRecencyText, nodeProfileLink } from "@dartfrog/puddle";
import ProfilePicture from "@dartfrog/puddle/components/ProfilePicture";
import useChatStore from "@dartfrog/puddle/store/chat";
import useForumStore, { ForumComment } from "../store/forum";
import { BASE_ORIGIN } from "../utils";
import IconTrash3Fill from './IconTrash';
import { ServiceID } from "@dartfrog/puddle";

const Comment: React.FC<{ comment: ForumComment; }> = ({ comment, }) => {
  const { api, peerMap, serviceId } = useChatStore();
  const { voteComment, deleteComment } = useForumStore();

  const parsedServiceId = ServiceID.fromString(serviceId);
  const isAdmin = parsedServiceId.hostNode() === window.our?.node;

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteComment(api, comment.post_id, comment.id);
    }
  };

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
        {comment.author ? (
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
            <a href={nodeProfileLink(comment.author, BASE_ORIGIN)}>
              <span className={getPeerNameColor(peerMap.get(comment.author))}>
                {comment.author}
              </span>
            </a>
          </div>
        ) : (
          <span>anon</span>
        )}
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
        }}
      >
        {comment.text}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "1rem",
          marginTop: "0.8rem",
          alignItems: "center",
        }}
      >
        <div
          style={{
            borderRadius: "10px",
            backgroundColor: "#333",
            display: "flex",
            flexDirection: "row",
            overflow:"hidden",
            padding:"0px",
            margin:'0px',
          }}
        >
          <button
            className="upvote-button"
            onClick={() => voteComment(api, comment.post_id, comment.id, true)}
            style={{
              flex:"1",
              width: "auto",
              height: "auto",
              padding: "4px",
              margin:"0px",
              paddingLeft:"0.4rem",
              border: "none",
            }}
          >
            ▲
          </button>
          <span
            style={{
              flexGrow: "1",
              padding: "0rem 0.5rem",
              fontSize: "0.8rem",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin:"0px",
              border: "none",
            }}
          >
            {comment.upvotes - comment.downvotes}
          </span>
          <button
            className="downvote-button"
            onClick={() => voteComment(api, comment.post_id, comment.id, false)}
            style={{
              flex:"1",
              width: "auto",
              height: "auto",
              padding: "4px",
              paddingRight:"0.4rem",
              border: "none",
              margin:"0px",
            }}
          >
            ▼
          </button>
        </div>
        {isAdmin && (
          <div
            onClick={handleDelete}
            className="delete-post-button"
            style={{
              borderRadius: "10px",
              padding: "0.1rem 0.5rem",
              fontSize: "0.8rem",
              display: "flex",
              flexDirection: "row",
              gap: "0.7rem",
              alignItems: "center",
              cursor:"pointer",
              color: "#999999",
              height:"1.2rem",
            }}
          >
            <IconTrash3Fill />
          </div>
        )}
      </div>
    </div>
  );
}

export default Comment;