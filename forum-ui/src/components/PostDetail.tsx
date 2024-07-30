import { useNavigate, useParams } from "react-router-dom";
import useForumStore from "../store/forum";
import useChatStore from "@dartfrog/puddle/store/chat";
import { useState } from "react";
import PostCard from "./PostCard";
import  Comment from "./Comment";
import ForumHeader from "./ForumHeader";

const PostDetail: React.FC = () => {
  const { postId} = useParams<{ postId?: string; }>();
  const { posts, vote, createComment } = useForumStore();
  const { api, serviceId } = useChatStore();
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
    <div
      style={{
        display:"flex",
        flexDirection:"column",
        height:"100%",
        maxHeight:"100%",
      }}

    >
      <ForumHeader includeForumButton={true} />
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

export default PostDetail;