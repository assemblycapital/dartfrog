import useChatStore from "@dartfrog/puddle/store/chat";
import { useState } from "react";
import useForumStore from "../store/forum";
import ForumHeader from "./ForumHeader";


const ForumAdmin: React.FC = () => {
  const { api, serviceId, serviceMetadata } = useChatStore();
  const { title, description, updateMetadata, banUser, unbanUser, } = useForumStore();
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
          <h3>Update Forum Metadata</h3>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New forum title"
            required
            style={{
              padding: "0.5rem",
              fontSize: "1rem",
              borderRadius: "4px",
              margin: "0",
            }}
          />
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="New forum description"
            required
            style={{
              padding: "0.5rem",
              fontSize: "1rem",
              borderRadius: "4px",
              margin: "0",
            }}
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
            Update Metadata
          </button>
        </form>

        <form onSubmit={handleBanUser}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h3>Ban User</h3>
          <div style={{ display: "flex", gap: "1rem" }}>
            <input
              type="text"
              value={userToBan}
              onChange={(e) => setUserToBan(e.target.value)}
              placeholder="User to ban"
              required
              style={{
                padding: "0.5rem",
                fontSize: "1rem",
                borderRadius: "4px",
                margin: "0",
                flexGrow: 1,
              }}
            />
            <button
              type="submit"
              style={{
                height: "auto",
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                cursor: "pointer",
                flex: "0 0 auto",
              }}
            >
              Ban User
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
          <h3>Banned Users</h3>
          <div
            style={{
              maxHeight: "200px",
              overflowY: "auto",
              border: "1px solid #333",
              borderRadius: "4px",
            }}
          >
            {/* {bannedUsers.map((user) => (
              <div
                key={user}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.5rem",
                  borderBottom: "1px solid #333",
                }}
              >
                <span>{user}</span>
                <button
                  onClick={() => handleUnbanUser(user)}
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Unban
                </button>
              </div>
            ))} */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumAdmin;