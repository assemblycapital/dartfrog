import { useState } from "react";
import useForumStore from "../store/forum";
import { useNavigate } from "react-router-dom";
import useChatStore from "@dartfrog/puddle/store/chat";
import ForumHeader from "./ForumHeader";

const CreatePost: React.FC = () => {
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostLink, setNewPostLink] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const { createPost } = useForumStore();
  const { api, serviceId } = useChatStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPost(api, {
      title: newPostTitle,
      text_contents: newPostContent,
      link: newPostLink || undefined,
      image_url: newPostImage || undefined,
    });
    setNewPostTitle('');
    setNewPostContent('');
    setNewPostLink('');
    setNewPostImage('');
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
      <ForumHeader includeForumButton={true} />
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
