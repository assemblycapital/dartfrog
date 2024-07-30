import useChatStore from "@dartfrog/puddle/store/chat";
import { useState } from "react";
import useForumStore from "../store/forum";
import ForumHeader from "./ForumHeader";


const ForumAdmin: React.FC = () => {
  const { api, serviceId, serviceMetadata } = useChatStore();
  const { title, description, updateMetadata, banUser, unbanUser, bannedUsers } = useForumStore();
  const [newTitle, setNewTitle] = useState(title);
  const [newDescription, setNewDescription] = useState(description);
  const [userToBan, setUserToBan] = useState('');

  const handleUpdateMetadata = (e: React.FormEvent) => {
    e.preventDefault();
    updateMetadata(api, newTitle, newDescription);
  };

  const handleBanUser = (e: React.FormEvent) => {
    e.preventDefault();
    banUser(api, userToBan);
    setUserToBan('');
  };

  const handleUnbanUser = (userToUnban: string) => {
    unbanUser(api, userToUnban);
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
          padding: "1rem",
        }}
      >
        <form onSubmit={handleUpdateMetadata}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div>update forum metadata</div>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="new forum title"
            required
            style={{
              padding: "0.5rem",
              fontSize: "1rem",
              borderRadius: "4px",
              margin: "0",
              border: "1px solid #333",
            }}
            className="color-white"
          />
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="new forum description"
            required
            style={{
              padding: "0.5rem",
              fontSize: "1rem",
              borderRadius: "4px",
              margin: "0",
              border: "1px solid #333",
            }}
            className="color-white"
          />
          <button
            type="submit"
            style={{
              height: "auto",
              width: "auto",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            update metadata
          </button>
        </form>

        <form onSubmit={handleBanUser}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div>ban user</div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <input
              type="text"
              value={userToBan}
              onChange={(e) => setUserToBan(e.target.value)}
              placeholder="user to ban"
              required
              style={{
                padding: "0.5rem",
                fontSize: "1rem",
                borderRadius: "4px",
                margin: "0",
                flexGrow: 1,
                border: "1px solid #333",
              }}
              className="color-white"
            />
            <button
              type="submit"
              style={{
                height: "auto",
                width:"auto",
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                cursor: "pointer",
                flex: "0 0 auto",
              }}
            >
              ban
            </button>
          </div>
        </form>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div>banned users</div>
          <div
            style={{
              maxHeight: "200px",
              overflowY: "auto",
              borderRadius: "4px",
            }}
          >
            {bannedUsers.map((user) => (
              <div
                key={user}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0.5rem",
                  borderBottom: "1px solid #333",
                  gap:"1rem",
                }}
              >
                <button
                  onClick={() => handleUnbanUser(user)}
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  unban
                </button>
                <span>{user}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumAdmin;