import { useNavigate, useParams } from "react-router-dom";
import useForumStore from "../store/forum";
import useChatStore from "@dartfrog/puddle/store/service";
import { useState, useEffect } from "react";
import PostCard from "./PostCard";
import ForumHeader from "./ForumHeader";

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId?: string }>();
  const { posts, vote, createComment, getPost } = useForumStore();
  const { api, serviceId } = useChatStore();
  const post = posts.find(p => p.id === Number(postId));
  const [newComment, setNewComment] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sortOption, setSortOption] = useState<string>('mostRecent');
  const [missingComments, setMissingComments] = useState<number[]>([]);

  const navigate = useNavigate();

  const comments = post ? posts.filter(p => p.thread_id === post.id) : [];

  const sortedComments = [...comments].sort((a, b) => {
    switch (sortOption) {
      case 'mostRecent':
        return b.created_at - a.created_at;
      case 'leastRecent':
        return a.created_at - b.created_at;
      case 'highestScore':
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      case 'lowestScore':
        return (a.upvotes - a.downvotes) - (b.upvotes - b.downvotes);
      default:
        return 0;
    }
  });

  useEffect(() => {
    if (post && post.comments) {
      const missing = post.comments.filter(
        commentId => !posts.some(p => p.id === commentId)
      );
      if (missing.length > 0) {
        setMissingComments(missing);
      }
      if (missing.length === 0) {
        setMissingComments([]);
      }
    }
  }, [post, posts]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    createComment(api, post.id, newComment, imageUrl, isAnonymous);
    setNewComment('');
    setImageUrl('');
    setIsAnonymous(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "100%",
      }}
    >
      <PostCard post_id={Number(postId)} showFullContents />
      <div
        style={{
          marginTop: "0.5rem",
          borderTop: "1px solid #333",
          paddingTop: "0.5rem",
        }}
      >
        <form
          onSubmit={handleSubmitComment}
          style={{
            margin: "none",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap:"0.5rem",
            }}
          >
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="write a comment..."
              required
              style={{
                resize: "both",
                margin: "none",
                fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
              }}
            />
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="image URL"
              style={{
                fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
                border:"1px solid #333",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              gap:"0.5rem",
            }}
          >
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  style={{ marginRight: '0.5rem' }}
                />
                Post anonymously
              </label>
            </div>
            <button
              type="submit"
              style={{
                width: "auto",
                height: "auto",
                padding: "0.5rem 1rem",
              }}
            >
              comment
            </button>
          </div>
        </form>
        <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
          <label htmlFor="sortComments">sort comments by: </label>
          <select
            id="sortComments"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            style={{
              padding: "0.25rem",
              fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
              width: "auto",
            }}
          >
            <option value="mostRecent">newest</option>
            <option value="leastRecent">oldest</option>
            <option value="highestScore">popular</option>
            <option value="lowestScore">unpopular</option>
          </select>
        </div>
        <div style={{ paddingBottom: "3rem" }}>
          {sortedComments.map((comment) => (
            <PostCard key={comment.id} post_id={comment.id} isComment />
          ))}
          {missingComments.map((commentId) => (
            <PostCard key={commentId} post_id={commentId} isComment />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;