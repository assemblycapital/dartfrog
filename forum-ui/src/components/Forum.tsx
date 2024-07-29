import React, { useState } from 'react';
import useForumStore, { ForumComment } from '../store/forum';
import useChatStore from '@dartfrog/puddle/store/chat';
import ProfilePicture from '@dartfrog/puddle/components/ProfilePicture';
import { getPeerNameColor, getRecencyText } from '@dartfrog/puddle';
import IconBxComment from './IconBxComment';

const PostList: React.FC<{ onSelectPost: (id: string) => void }> = ({ onSelectPost }) => {
  const { posts, vote } = useForumStore();
  const { api, peerMap } = useChatStore();

  return (
    <div
      style={{
        display:"flex",
        flexDirection:"column",
        gap:"5px",
      }}
    >
      {posts.map((post) => (
        <div key={post.id}
          style={{
            display:"flex",
            flexDirection:"column",
            padding:"0.8rem",
          }}
          className="hover-dark-gray"
        >
          <div
            style={{
              display:"flex",
              flexDirection:"row",
              gap:"10px",
              alignItems: "center", // Add this line
              fontSize:"0.9rem",
            }}
          >
            {!post.author ? (
              <span>
                anon
              </span>
            ):(
              <div
                style={{
                  display:"flex",
                  flexDirection:"row",
                  gap:"10px",
                  alignItems: "center", // Add this line to the inner div as well
                }}
                >
                  <ProfilePicture size="25px" node={post.author} />
                  <span
                    className={getPeerNameColor(peerMap.get(post.author))}
                  >
                    {post.author}
                  </span>
                </div>
            )}
            <span
              style={{
                fontSize:"0.7rem",
                color:'gray',

              }}
            >
              {getRecencyText(Date.now() - post.created_at*1000)}
            </span>
          </div>
          <div
            onClick={() => onSelectPost(post.id)}
            style={{
              fontWeight: "bold",
              margin: "0.5rem 0rem",
            }}
          >
              {post.title}
          </div>

          <div
            style={{
              fontSize:"0.8rem",
            }}
          >
            {post.text_contents}
          </div>
          <div
            style={{
              display:"flex",
              flexDirection:"row",
              gap:"1rem",
              marginTop:"0.8rem",
            }}
          >
            <div
            style={{
              borderRadius:"10px",
              backgroundColor:"#333",
              padding:"0.1rem 0.5rem"
              }}
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  vote(api, post.id, true)
                  }}
                style={{
                  width:"auto",
                  height:"auto",
                  padding:"4px",
                  borderRadius:"100px",
                  backgroundColor:"#00000000",
                }}
                >
                ▲
              </button>
              <span
                style={{
                  padding:"0rem 0.5rem",
                  fontSize:"0.8rem",
                }}
              >
                {post.upvotes - post.downvotes}
              </span>
              <button
                onClick={() => vote(api, post.id, false)}
                style={{
                  width:"auto",
                  height:"auto",
                  padding:"4px",
                  borderRadius:"100px",
                  backgroundColor:"#00000000",
                }}
              >
                ▼
              </button>
            </div>

            <div
            style={{
              borderRadius:"10px",
              backgroundColor:"#333",
              padding:"0.1rem 0.5rem",
              fontSize:"0.8rem",
              display:"flex",
              flexDirection:"row",
              gap:"0.7rem",
              alignItems: "center"
              }}
            >
              <IconBxComment />
              {post.comments.length}
            </div>
          </div>
        </div>
      ))}
    </ div>
  );
};

const Comment: React.FC<{ comment: ForumComment }> = ({ comment }) => (
  <div>
    <p>Author: {comment.author}</p>
    <p>{comment.text}</p>
  </div>
);

const PostDetail: React.FC<{ postId: string; onBack: () => void }> = ({ postId, onBack }) => {
  const { posts, vote, createComment } = useForumStore();
  const { api } = useChatStore();
  const post = posts.find(p => p.id === postId);
  const [newComment, setNewComment] = useState('');

  if (!post) return <div>Post not found</div>;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    createComment(api, postId, newComment);
    setNewComment('');
  };

  return (
    <div>
      <h2>{post.title}</h2>
      {post.author && <p>Author: {post.author}</p>}
      <p>{post.text_contents}</p>
      <div>
        <button onClick={() => vote(api, post.id, true)}>Upvote</button>
        <span>{post.upvotes}</span>
        <button onClick={() => vote(api, post.id, false)}>Downvote</button>
        <span>{post.downvotes}</span>
      </div>
      <button onClick={onBack}>Back to all posts</button>
      <h3>Comments</h3>
      {post.comments.map((comment) => (
        <Comment key={comment.id} comment={comment} />
      ))}
      <form onSubmit={handleSubmitComment}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          required
        />
        <button type="submit">Add Comment</button>
      </form>
    </div>
  );
};

const CreatePostForm: React.FC = () => {
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

const Forum: React.FC = () => {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  return (
    <div>
      {!selectedPostId && <CreatePostForm />}

      {selectedPostId ? (
        <PostDetail postId={selectedPostId} onBack={() => setSelectedPostId(null)} />
      ) : (
        <PostList onSelectPost={setSelectedPostId} />
      )}
    </div>
  );
};

export default Forum;