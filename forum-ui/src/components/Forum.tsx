import React, { useState } from 'react';
import useForumStore, { ForumComment } from '../store/forum';
import useChatStore from '@dartfrog/puddle/store/chat';
import ProfilePicture from '@dartfrog/puddle/components/ProfilePicture';
import { getPeerNameColor, getRecencyText, nodeProfileLink, ServiceID } from '@dartfrog/puddle';
import { PostCard } from './PostCard';
import { Routes, Route, useParams } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import ChatBox from '@dartfrog/puddle/components/ChatBox';
import DisplayUserActivity from '@dartfrog/puddle/components/DisplayUserActivity';


const ForumHeader: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "1.3rem",
        overflow:"hidden",
        margin:'0.7rem 0rem 0.4rem 0rem',
        alignItems: "flex-end"
      }}
    >
      <div
        style={{
          fontWeight:"bold",
        }}
      >
        generic forum
      </div>
      <div
        style={{
          fontSize:"0.8rem",
        }}
      >
        generic description 
      </div>
    </div>
  )
}

const HomePage: React.FC = () => {
  const {serviceId} = useChatStore();
  const parsedServiceId = ServiceID.fromString(serviceId)
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        overflowX:"hidden",
        overflowY:"auto",
      }}
    >
      <ForumHeader />
      <div
        style={{
          display:"flex",
          flexDirection:"row",
          gap:"1rem",
        }}
      >
        <button
          style={{
            width:'auto',
            height:'auto',
            padding:'0.5rem 1rem',
          }}
          onClick={()=>{
            navigate(`/df/service/${serviceId}/new`)
          }}
        >
          create a post
        </button>
        <button
          style={{
            width:'auto',
            height:'auto',
            padding:'0.5rem 1rem',
          }}
          onClick={()=>{
            navigate(`/df/service/${serviceId}/chat`)
          }}
        >
          chat
        </button>
      </div>

      <PostList />
    </div>

  )
}
const PostList: React.FC = () => {
  const { posts, vote } = useForumStore();
  const { api, peerMap } = useChatStore();

  // Sort posts by created_at in descending order (newest first)
  const sortedPosts = [...posts].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        overflowX:"hidden",
        overflowY:"auto",
      }}
    >
      {sortedPosts.map((post) => (
        <div key={post.id}>
          <PostCard post={post} />
        </div>
      ))}
    </div>
  );
};

const baseOrigin = window.origin.split(".").slice(1).join(".")
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
              href={nodeProfileLink(comment.author, baseOrigin)}
              style={{ display: "flex", alignItems: "center" }}
            >
              <ProfilePicture size="25px" node={comment.author} />
            </a>

            <a
              href={nodeProfileLink(comment.author, baseOrigin)}
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

const PostDetail: React.FC = () => {
  const { postId} = useParams<{ postId?: string; }>();
  const { posts, vote, createComment } = useForumStore();
  const { api } = useChatStore();
  const post = posts.find(p => p.id === postId);
  const [newComment, setNewComment] = useState('');

  const navigate = useNavigate();

  if (!post) return <div>Post not found</div>;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    createComment(api, postId, newComment);
    setNewComment('');
  };

  return (
    <div>
      <button
        onClick={()=> {
          navigate("..")
        }}
        style={{
          width:'auto',
          height:'auto',
          padding:'0.5rem 1rem',
          margin: '0.3rem 0rem',
        }}
        >
        all posts
      </button>
      <PostCard post={post} showFullContents />
      <div
        style={{
          marginTop:"1rem",
          borderTop:"1px solid #333",
          paddingTop:"1rem",
        }}
      >
        <form onSubmit={handleSubmitComment}
          style={{
            margin:"none",
            display:"flex",
            flexDirection:"row",

          }}
        >
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="write a comment..."
            required
            style={{
              resize:'both',
              margin:"none",
              fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
            }}
          />
          <button
            type="submit"
            style={{
              width:'auto',
              height:'auto',
              padding:'0.5rem 1rem',
            }}
          >
            comment
          </button>
        </form>
        <div>
          {post.comments.map((comment) => (
            <Comment key={comment.id} comment={comment} />
          ))}
        </div>
      </div>
    </div>
  );
};

const CreatePost: React.FC = () => {
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const { createPost } = useForumStore();
  const { api } = useChatStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPost(api, {
      title: newPostTitle,
      text_contents: newPostContent,
    });
    setNewPostTitle('');
    setNewPostContent('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={newPostTitle}
        onChange={(e) => setNewPostTitle(e.target.value)}
        placeholder="Post title"
        required
      />
      <textarea
        value={newPostContent}
        onChange={(e) => setNewPostContent(e.target.value)}
        placeholder="Post content"
        required
      />
      <button type="submit">Create Post</button>
    </form>
  );
};

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
      <div
        style={{
          display:"flex",
          flexDirection:"row",
          gap:"1.3rem",
        }}
      >

        <button
          style={{
            width:'auto',
            height:'auto',
            padding:'0.5rem 1rem',
          }}
          onClick={()=>{
            navigate(`/df/service/${serviceId}/forum`)
          }}
        >
          
          forum
        </button>
        <ForumHeader />
      </div>
      <ChatBox chatState={chatState} />
      <DisplayUserActivity metadata={serviceMetadata} />
    </div>
    
  )
}
const Forum: React.FC = () => {

  return (
    <Routes>
        <Route path="/post/:postId" element={
          <PostDetail />
          } />
        <Route path="/*" element={
          <HomePage />
        } />
        <Route path="/new" element={
          <CreatePost />
        } />
        <Route path="/chat" element={
          <ForumChat />
        } />
      </Routes>
  );
};

export default Forum;