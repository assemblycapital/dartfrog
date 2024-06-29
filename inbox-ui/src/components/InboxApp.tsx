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
    <div 
      style={{
      width: "100%",
      height: "100%",
    }}>
      {inboxView === null ? (
        <>
          <div 
            style={{ 
              marginBottom: '0.4rem', 
              display: 'flex', 
              flexDirection: 'row', 
              alignItems: 'center',
              gap: "4px"
            }}
          >
            <input
              type="text"
              value={addUsernameInput}
              onChange={(e) => setAddUsernameInput(e.target.value)}
              placeholder="username.os"
              style={{
                flexGrow: "1"
              }}
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
            {[...inboxService.inboxes.entries()]
              .sort(([, inboxA], [, inboxB]) => {
                const latestMessageA = inboxA.messages[inboxA.messages.length - 1];
                const latestMessageB = inboxB.messages[inboxB.messages.length - 1];
                if (!latestMessageA || !latestMessageB) {
                    return 0; // Handle case where there are no messages
                }
                return new Date(latestMessageB.time).getTime() - new Date(latestMessageA.time).getTime();
              })
              .map(([user, inbox], index) => (
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
