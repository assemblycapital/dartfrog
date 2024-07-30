import useChatStore from "@dartfrog/puddle/store/chat";
import useForumStore from "../store/forum";
import PostCard from "./PostCard";

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

export default PostList;