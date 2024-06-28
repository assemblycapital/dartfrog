import React, { useState, useCallback } from 'react';
import { InboxService } from '../store/inbox';
import useInboxStore, { PLUGIN_NAME } from "../store/inbox";
import { serialize } from 'v8';
import InboxPreview from './InboxPreview';
import InboxUser from './InboxUser';

// Define TypeScript interfaces based on Rust structs
const InboxApp: React.FC<{ inboxService: InboxService }> = ({ inboxService }) => {
  const [addUsernameInput, setAddUsernameInput] = useState('');
  
  const [inboxView, setInboxView] = useState<string | null>(null);

  const { createInbox } = useInboxStore();
  const handleCreateInbox = useCallback(() => {
    if (addUsernameInput === "") {
      return;
    }
    let kindaParse = addUsernameInput.split(".")
    if (kindaParse.length != 2) {
      return;
    }
    createInbox(addUsernameInput);
    setAddUsernameInput('')
  }, [createInbox, addUsernameInput]);

  const handleInboxClick = useCallback((user: string) => {
    setInboxView(user);
  }, []);

  if (!(inboxService.inboxes instanceof Map)) {
    return <div>loading inboxes</div>
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif',
      width: "100%",
    }}>
      {inboxView === null ? (
        <>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              value={addUsernameInput}
              onChange={(e) => setAddUsernameInput(e.target.value)}
              placeholder="username.os"
            />
            <button onClick={handleCreateInbox} style={{ padding: '5px 10px' }}>
              Add
            </button>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            {[...inboxService.inboxes.entries()].map(([user, inbox], index) => (
              <div
                key={user}
                onClick={() => handleInboxClick(user)}
              >
                <InboxPreview user={user} inbox={inbox} />
              </div>

            ))}
          </div>
        </>
      ) : (
        <>
          <InboxUser user={inboxView} inbox={inboxService.inboxes.get(inboxView)} goBack={()=>{
            setInboxView(null);
          }}/>
        </>
      )}
    </div>
  );
};

export default InboxApp;
