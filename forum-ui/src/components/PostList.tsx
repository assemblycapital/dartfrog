import useChatStore from "@dartfrog/puddle/store/service";
import useForumStore from "../store/forum";
import PostCard from "./PostCard";

const PostList: React.FC = () => {
  const { posts, vote } = useForumStore();
  const { api, peerMap } = useChatStore();

  // Sort posts: sticky posts first, then by created_at in descending order
  const sortedPosts = [...posts]
    .filter(post => !post.thread_id)
    .sort((a, b) => {
      if (a.is_sticky && !b.is_sticky) return -1;
      if (!a.is_sticky && b.is_sticky) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        paddingBottom: "3rem",
        flexGrow: "1",
      }}
    >
      {sortedPosts.length > 0 ? (
        sortedPosts.map((post) => (
          <div key={post.id}>
            <PostCard post_id={post.id} />
          </div>
        ))
      ) : (
        <div style={{
          color: "gray",
          textAlign: "center",
          padding: "20px",
          flexGrow: "1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%"
        }}>
          No posts yet
        </div>
      )}
    </div>
  );
};

export default PostList;