import React, { useState, useRef } from 'react';
import useForumStore, { ForumPost } from '../store/forum';
import useChatStore from '@dartfrog/puddle/store/service';
import ProfilePicture from '@dartfrog/puddle/components/ProfilePicture';
import { getPeerNameColor, getRecencyText, nodeProfileLink, dfLinkToRealLink } from '@dartfrog/puddle';
import IconBxsComment from './IconBxsComment';
import { useNavigate } from 'react-router-dom';
import { PROCESS_NAME } from '../utils';
import { ServiceID } from "@dartfrog/puddle";
import IconTrash3Fill from './IconTrash';
import IconPushpin from './IconPushpin';

interface PostCardProps {
  post_id: number;
  showFullContents?: boolean;
  isComment?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post_id, showFullContents = false, isComment = false }) => {
  const { posts, vote, deletePost, toggleSticky, getPost, getPostAuthor } = useForumStore();
  const { api, peerMap, serviceId } = useChatStore();
  const baseOrigin = window.origin.split(".").slice(1).join(".")
  const navigate = useNavigate();
  const [requested, setRequested] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const parsedServiceId = ServiceID.fromString(serviceId);
  const isAdmin = parsedServiceId.hostNode() === window.our?.node;

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

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePost(api, post_id);
    }
  };

  const handleToggleSticky = () => {
    if (window.confirm(`Are you sure you want to ${post.is_sticky ? 'unstick' : 'stick'} this post?`)) {
      toggleSticky(api, post_id);
    }
  };

  const handleRequestAuthor = () => {
    getPostAuthor(api, post_id);
  };

  const post = posts.find(p => p.id === post_id);

  if (!post) {
    if (!requested) {
      getPost(api, post_id);
      setRequested(true);
    }
    return (
      <div style={{ padding: '0.8rem', border: '1px solid #333', fontSize:"0.8rem", color:"gray", }}>
        <span>loading post...</span>
      </div>
    );
  }

  return (
    <div
      key={post.id}
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "8px",
        border: post.is_sticky ? "1px solid #333" : "none",
        gap: "0.4rem",
      }}
      className="hover-dim"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "10px",
          alignItems: "flex-end",
          fontSize: "0.8rem",
        }}
      >
        {!post.author ? (
          <span
            style={{
              cursor:"default",
            }}
          >
            anonymous
          </span>
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
              style={{
                alignItems: "flex-end",
                display: 'inline-flex',

              }}
              className={getPeerNameColor(peerMap.get(post.author))}
            >
              {post.author}
            </a>
          </div>
        )}
        <span
          style={{
            fontSize: "0.7rem",
            color: 'gray',
          }}
        >
          No.{post.id}
        </span>
        <span
          style={{
            fontSize: "0.7rem",
            color: 'gray',
          }}
        >
          {getRecencyText(Date.now() - post.created_at * 1000)}
        </span>
        {post.is_sticky &&
          <span
            style={{
              fontSize: "0.7rem",
              color: 'gray',
            }}
          >

            (sticky)
          </span>
        }
      </div>
      <div
        style={{
          cursor: (showFullContents || isComment) ? 'default' : 'pointer',
          // display: 'flex',
          // flexWrap: 'wrap',
          // alignItems: 'flex-start',
        }}
        onClick={() => {
          if (showFullContents) return;
          if (isComment) return;
          navigate(`/df/service/${serviceId}/post/${post.id}`)
        }}
      >
        {post.image_url && (
            <img 
              src={post.image_url} 
              alt="Post image" 
              onClick={(e) => {
                if (showFullContents) {
                  e.stopPropagation();
                  setShowFullImage(!showFullImage);
                }
              }}
              style={{ 
                maxWidth: showFullImage ? '100%' : '200px',
                width:'auto',
                height:'auto',
                maxHeight: showFullImage ? '100%' : '200px',
                float:"left",
                marginRight:"9px",
                objectFit: 'cover',
                cursor: 'pointer',
                display: showFullImage ? 'block' : 'inline-block',
              }} 
            />
        )}
        <blockquote
          style={{
            fontSize: "0.8rem",
            maxHeight: showFullContents ? 'none' : '190px',
            overflow: showFullContents ? 'visible' : 'hidden',
            textOverflow: showFullContents ? 'clip' : 'ellipsis',
            WebkitLineClamp: showFullContents ? 'none' : 3,
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {post.text_contents.split(/\n/)
            .map((line, index, array) => (
              <React.Fragment key={index}>
                <span
                  className={`${line.startsWith('>') ? 'green-text' : ''}`}
                  // style={{ display: 'inline-block', width: '100%' }}
                >
                  {line}
                </span>
                {index < array.length - 1 && <br />}
              </React.Fragment>
            ))}
        </blockquote>
        
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
          marginTop: "0.3rem",
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
            onClick={(e) => {
              e.preventDefault();
              vote(api, post_id, true)
            }}
            style={{
              flex:"1",
              width: "auto",
              height: "auto",
              padding: "4px",
              margin:"0px",
              paddingLeft:"0.4rem",
              border: "none",
              borderRadius: "0px",
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
              borderRadius: "0px",
            }}
          >
            {post.upvotes - post.downvotes}
          </span>
          <button
            className="downvote-button"
            onClick={() => vote(api, post_id, false)}
            style={{
              flex:"1",
              width: "auto",
              height: "auto",
              padding: "4px",
              paddingRight:"0.4rem",
              border: "none",
              borderRadius: "0px",
              margin:"0px",
            }}
          >
            ▼
          </button>
        </div>
        {!isComment &&
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
              navigate(`/df/service/${serviceId}/post/${post_id}`)
            }}
            className="comment-button"
          >
            <IconBxsComment />
            {post.comments.length}
          </div>
        }
        {isAdmin && (
          <>
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
            {!isComment &&
              <div
                onClick={handleToggleSticky}
                className="toggle-sticky-button"
                style={{
                  borderRadius: "10px",
                  padding: "0.1rem 0.5rem",
                  fontSize: "0.8rem",
                  display: "flex",
                  flexDirection: "row",
                  gap: "0.7rem",
                  alignItems: "center",
                  cursor:"pointer",
                  color: post.is_sticky ? "#4a90e2" : "#999999",
                  height:"1.2rem",
                }}
              >
                <IconPushpin />
              </div>
            }
          </>
        )}
        {isAdmin && !post.author && (
          <div
            onClick={handleRequestAuthor}
            className="request-author-button"
            style={{
              padding: "0.1rem 0.5rem",
              fontSize: "0.7rem",
              display: "flex",
              flexDirection: "row",
              gap: "0.7rem",
              alignItems: "center",
              cursor: "pointer",
              height: "1.2rem",
              color: "gray",
            }}
          >
            {/* <IconUserFill /> */}
            {post.authorRequested ? "requested" : "get author"}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;