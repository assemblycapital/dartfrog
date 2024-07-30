import { useNavigate, useParams } from "react-router-dom";
import useForumStore from "../store/forum";
import useChatStore from "@dartfrog/puddle/store/chat";
import { useState, useMemo } from "react";
import PostCard from "./PostCard";
import Comment from "./Comment";
import ForumHeader from "./ForumHeader";

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId?: string; }>();
  const { posts, vote, createComment } = useForumStore();
  const { api, serviceId } = useChatStore();
  const post = posts.find(p => p.id === postId);
  const [newComment, setNewComment] = useState('');
  const [sortOption, setSortOption] = useState<string>('highestScore');

  const navigate = useNavigate();

  const sortedComments = useMemo(() => {
    if (!post) return [];
    
    return [...post.comments].sort((a, b) => {
      switch (sortOption) {
        case 'mostRecent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'leastRecent':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'highestScore':
          return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
        case 'lowestScore':
          return (a.upvotes - a.downvotes) - (b.upvotes - b.downvotes);
        default:
          return 0;
      }
    });
  }, [post, sortOption]);

  if (!post) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          maxHeight: "100%",
        }}
      >
        <ForumHeader includeForumButton={true} />
        <div>Post not found</div>
      </div>
    );
  }

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
        <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
          <label htmlFor="sortComments">sort comments by: </label>
          <select
            id="sortComments"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            style={{
              padding: '0.25rem',
              fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
              width:"auto",
            }}
          >
            <option value="mostRecent">newest</option>
            <option value="leastRecent">oldest</option>
            <option value="highestScore">popular</option>
            <option value="lowestScore">unpopular</option>
          </select>
        </div>
        <div>
          {sortedComments.map((comment) => (
            <Comment key={comment.id} comment={comment} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;