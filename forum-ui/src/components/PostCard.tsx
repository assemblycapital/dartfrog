import React from 'react';
import useForumStore, { ForumPost } from '../store/forum';
import useChatStore from '@dartfrog/puddle/store/chat';
import ProfilePicture from '@dartfrog/puddle/components/ProfilePicture';
import { getPeerNameColor, getRecencyText, nodeProfileLink } from '@dartfrog/puddle';
import IconBxsComment from './IconBxsComment';
import { useNavigate } from 'react-router-dom';
import { PROCESS_NAME } from '../utils';

interface PostCardProps {
  post: ForumPost;
  showFullContents?: boolean
}

export const PostCard: React.FC<PostCardProps> = ({ post, showFullContents = false }) => {
  const { posts, vote } = useForumStore();
  const { api, peerMap, serviceId } = useChatStore();
  const baseOrigin = window.origin.split(".").slice(1).join(".")
  const navigate = useNavigate();
  return (
    <div
      key={post.id}
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
        {!post.author ? (
          <span>anon</span>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "10px",
              alignItems: "center",
            }}
          >
            
            <a
              href={nodeProfileLink(post.author, baseOrigin)}
              style={{ display: "flex", alignItems: "center" }}
            >
              <ProfilePicture size="25px" node={post.author} />
            </a>

            <a
              href={nodeProfileLink(post.author, baseOrigin)}
            >
              <span className={getPeerNameColor(peerMap.get(post.author))}>
                {post.author}
              </span>
            </a>
          </div>
        )}
        <span
          style={{
            fontSize: "0.7rem",
            color: 'gray',
          }}
        >
          {getRecencyText(Date.now() - post.created_at * 1000)}
        </span>
      </div>
      <div
        style={{
          fontWeight: "bold",
          margin: "0.5rem 0rem",
          maxHeight: showFullContents ? 'none' : '3em',
          overflow: showFullContents ? 'visible' : 'hidden',
          textOverflow: showFullContents ? 'clip' : 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: showFullContents ? 'none' : 2,
          WebkitBoxOrient: 'vertical',
          cursor: showFullContents ? 'default' : 'pointer',
        }}
        onClick={() => {
          if (showFullContents) return;
          navigate(`/df/service/${serviceId}/post/${post.id}`)
        }}
      >
        {post.title}
      </div>
      <div
        style={{
          fontSize: "0.8rem",
          maxHeight: showFullContents ? 'none' : '4.8em',
          overflow: showFullContents ? 'visible' : 'hidden',
          textOverflow: showFullContents ? 'clip' : 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: showFullContents ? 'none' : 3,
          WebkitBoxOrient: 'vertical',
          cursor: showFullContents ? 'default' : 'pointer',
        }}
        onClick={() => {
          if (showFullContents) return;
          navigate(`/df/service/${serviceId}/post/${post.id}`)
        }}
      >
        {post.text_contents}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "1rem",
          marginTop: "0.8rem",
        }}
      >
        <div
          style={{
            borderRadius: "10px",
            backgroundColor: "#333",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              vote(api, post.id, true)
            }}
            style={{
              flex:"1",
              width: "auto",
              height: "auto",
              padding: "4px",
              borderRadius: "100px",
              backgroundColor: "#00000000",
              margin:"0px",
              paddingLeft:"0.4rem",
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
            }}
          >
            {post.upvotes - post.downvotes}
          </span>
          <button
            onClick={() => vote(api, post.id, false)}
            style={{
              flex:"1",
              width: "auto",
              height: "auto",
              padding: "4px",
              borderRadius: "100px",
              backgroundColor: "#00000000",
              paddingRight:"0.4rem",
            }}
          >
            ▼
          </button>
        </div>
        <div
          style={{
            borderRadius: "10px",
            backgroundColor: "#333",
            padding: "0.1rem 0.5rem",
            fontSize: "0.8rem",
            display: "flex",
            flexDirection: "row",
            gap: "0.7rem",
            alignItems: "center",
            cursor:"pointer",
          }}
          onClick={()=>{
            navigate(`/df/service/${serviceId}/post/${post.id}`)
          }}
        >
          <IconBxsComment />
          {post.comments.length}
        </div>
      </div>
    </div>
  );
};