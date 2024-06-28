import React, { useState, useCallback } from 'react';
import { InboxService } from '../store/inbox';
import useInboxStore, { PLUGIN_NAME } from "../store/inbox";
import { serialize } from 'v8';

// Define TypeScript interfaces based on Rust structs
const InboxApp: React.FC<{ inboxService: InboxService }> = ({ inboxService }) => {
  const [username, setUsername] = useState('');

  const { createInbox } = useInboxStore();
  const handleCreateInbox = useCallback(() => {
    createInbox(username);
    setUsername('')
  }, [createInbox, username]);

  if (!(inboxService.inboxes instanceof Map)) {
    return <div>loading inboxes</div>
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* <div style={{ fontSize: '24px', marginBottom: '10px' }}>Inbox</div> */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username.os"
          // style={{ padding: '5px', marginRight: '10px' }}
        />
        <button onClick={handleCreateInbox} style={{ padding: '5px 10px' }}>
          Add
        </button>
      </div>
      <ul>
        {[...inboxService.inboxes.entries()].map(([key, inbox], index) => (
          <li key={index}>{key}: {key}</li>
        ))}
      </ul>
    </div>
  );
};

export default InboxApp;