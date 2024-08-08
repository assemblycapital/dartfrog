import { useState } from "react";
import useForumStore from "../store/forum";
import { useNavigate } from "react-router-dom";
import useChatStore from "@dartfrog/puddle/store/chat";
import ForumHeader from "./ForumHeader";
import { ServiceID } from "@dartfrog/puddle";

const CreatePost: React.FC = () => {
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostLink, setNewPostLink] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [isSticky, setIsSticky] = useState(false);
  const [isAnon, setIsAnon] = useState(false);
  const { createPost, createStickyPost } = useForumStore();
  const { api, serviceId } = useChatStore();
  const navigate = useNavigate();

  const parsedServiceId = ServiceID.fromString(serviceId);
  const isAdmin = parsedServiceId.hostNode() === window.our?.node;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const postData = {
      title: newPostTitle,
      text_contents: newPostContent,
      link: newPostLink || undefined,
      image_url: newPostImage || undefined,
      is_anon: isAnon,
    };

    if (isSticky) {
      createStickyPost(api, postData);
    } else {
      createPost(api, postData);
    }

    setNewPostTitle('');
    setNewPostContent('');
    setNewPostLink('');
    setNewPostImage('');
    setIsSticky(false);
    setIsAnon(false);
    navigate("..")
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
      <form onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          padding: "1rem",
        }}
      >
        <input
          type="text"
          value={newPostTitle}
          onChange={(e) => setNewPostTitle(e.target.value)}
          placeholder="Post title"
          required
          style={{
            padding: "0.5rem",
            fontSize: "1rem",
            borderRadius: "4px",
            margin: "0",
          }}
          className="color-white"
        />
        <textarea
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder="Post content"
          required
          style={{
            fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
            padding: "0.5rem",
            fontSize: "1rem",
            borderRadius: "4px",
            minHeight: "100px",
            resize: "vertical",
            margin: "0",
          }}
          className="color-white"
        />
        <input
          type="url"
          value={newPostLink}
          onChange={(e) => setNewPostLink(e.target.value)}
          placeholder="Add a link (optional)"
          style={{
            padding: "0.5rem",
            fontSize: "1rem",
            borderRadius: "4px",
            border: "1px solid #333",
            backgroundColor: "#1f1f1f",
          }}
          className="color-white"
        />
        <input
          type="url"
          value={newPostImage}
          onChange={(e) => setNewPostImage(e.target.value)}
          placeholder="Add an image URL (optional)"
          style={{
            padding: "0.5rem",
            fontSize: "1rem",
            borderRadius: "4px",
            border: "1px solid #333",
            backgroundColor: "#1f1f1f",
          }}
          className="color-white"
        />
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            id="anonToggle"
            checked={isAnon}
            onChange={(e) => setIsAnon(e.target.checked)}
            style={{ margin: 0 }}
          />
          <label htmlFor="anonToggle">post anonymously</label>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              id="stickyToggle"
              checked={isSticky}
              onChange={(e) => setIsSticky(e.target.checked)}
              style={{ margin: 0 }}
            />
            <label htmlFor="stickyToggle">make this a sticky post</label>
          </div>
        )}
        <button
          type="submit"
          style={{
            height:"auto",
            width:"auto",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          submit
        </button>
      </form>
    </div>
  );
};

export default CreatePost;