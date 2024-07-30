import React from 'react';
import useForumStore, { ForumPost } from '../store/forum';
import useChatStore from '@dartfrog/puddle/store/chat';
import ProfilePicture from '@dartfrog/puddle/components/ProfilePicture';
import { getPeerNameColor, getRecencyText, nodeProfileLink, dfLinkToRealLink } from '@dartfrog/puddle';
import IconBxsComment from './IconBxsComment';
import { useNavigate } from 'react-router-dom';
import { PROCESS_NAME } from '../utils';

interface PostCardProps {
  post: ForumPost;
  showFullContents?: boolean
}

const PostCard: React.FC<PostCardProps> = ({ post, showFullContents = false }) => {
  const { posts, vote } = useForumStore();
  const { api, peerMap, serviceId } = useChatStore();
  const baseOrigin = window.origin.split(".").slice(1).join(".")
  const navigate = useNavigate();

  const linkRegex = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i;
  const dfLinkRegex = /^df:\/\/.+/;

  const renderLink = (link: string) => {
    if (linkRegex.test(link)) {
      return (
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: '#4a90e2', textDecoration: 'none' }}
        >
          {link}
        </a>
      );
    } else if (dfLinkRegex.test(link)) {
      const realLink = dfLinkToRealLink(link, baseOrigin);
      return (
        <a
          href={realLink}
          style={{ color: '#4a90e2', textDecoration: 'none' }}
        >
          {link}
        </a>
      );
    }
    return link;
  };

  return (
    <div
      key={post.id}
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "0.8rem",
      }}
      className="forum-post"
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
          cursor: showFullContents ? 'default' : 'pointer',
        }}
        onClick={() => {
          if (showFullContents) return;
          navigate(`/df/service/${serviceId}/post/${post.id}`)
        }}
      >
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
          }}
        >
          {post.text_contents}
        </div>
        
        {post.image_url && (
          <div style={{ marginTop: '0.5rem', maxWidth: '100%', overflow: 'hidden' }}>
            <img 
              src={post.image_url} 
              alt="Post image" 
              style={{ 
                maxWidth: '100%', 
                height: 'auto', 
                borderRadius: '8px',
                maxHeight: showFullContents ? 'none' : '200px',
                objectFit: 'cover'
              }} 
            />
          </div>
        )}
        
        {post.link && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
            {renderLink(post.link)}
          </div>
        )}
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
            overflow:"hidden",
            padding:"0px",
            margin:'0px',
          }}
        >
          <button
            className="upvote-button"
            onClick={(e) => {
              e.preventDefault();
              vote(api, post.id, true)
            }}
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
            {post.upvotes - post.downvotes}
          </span>
          <button
            className="downvote-button"
            onClick={() => vote(api, post.id, false)}
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
        <div
          style={{
            borderRadius: "10px",
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
          className="comment-button"
        >
          <IconBxsComment />
          {post.comments.length}
        </div>
      </div>
    </div>
  );
};

export default PostCard;