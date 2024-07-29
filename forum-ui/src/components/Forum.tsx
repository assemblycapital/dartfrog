import React, { useState } from 'react';
import useForumStore, { ForumComment } from '../store/forum';
import useChatStore from '@dartfrog/puddle/store/chat';

const PostList: React.FC<{ onSelectPost: (id: string) => void }> = ({ onSelectPost }) => {
  const { posts, vote } = useForumStore();
  const { api } = useChatStore();

  return (
    <>
      {posts.map((post) => (
        <div key={post.id}>
          <h2><a href="#" onClick={() => onSelectPost(post.id)}>{post.title}</a></h2>
          {post.author && <p>Author: {post.author}</p>}
          <p>{post.text_contents.substring(0, 100)}...</p>
          <div>
            <button onClick={() => vote(api, post.id, true)}>Upvote</button>
            <span>{post.upvotes}</span>
            <button onClick={() => vote(api, post.id, false)}>Downvote</button>
            <span>{post.downvotes}</span>
            <span>Comments: {post.comments.length}</span>
          </div>
        </div>
      ))}
    </>
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

const Forum: React.FC = () => {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const { createPost } = useForumStore();
  const { api } = useChatStore();
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    createPost(api, {
      title: newPostTitle,
      text_contents: newPostContent,
    });
    setNewPostTitle('');
    setNewPostContent('');
  };

  return (
    <div>
      <h1>Welcome to the Forum</h1>
      
      {!selectedPostId && (
        <form onSubmit={handleCreatePost}>
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
      )}

      {selectedPostId ? (
        <PostDetail postId={selectedPostId} onBack={() => setSelectedPostId(null)} />
      ) : (
        <PostList onSelectPost={setSelectedPostId} />
      )}
    </div>
  );
};

export default Forum;