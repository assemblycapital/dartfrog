import React, { useState, useEffect } from 'react';
import { Inbox } from '../store/inbox';
import  useInboxStore from '../store/inbox';
import { computeColorForName } from '@dartfrog/puddle';

interface InboxPreviewProps {
  user: string;
  inbox: Inbox;
}

const InboxPreview: React.FC<InboxPreviewProps> = ({ user, inbox}) => {
  const [nameColor, setNameColor] = useState<string>('');

  const { nameColors, addNameColor} = useInboxStore();

  useEffect(() => {
    const fetchNameColor = () => {
      let color = nameColors[user];
      if (!color) {
        color = computeColorForName(user)
      }
      setNameColor(color);
    };
    fetchNameColor();
  }, [user]);

  return (
    <div 
      className={`inbox-preview ${inbox.has_unread && 'inbox-unread'}`}
      style={{
        display:"flex",
        flexDirection: "row",
        gap: "0.8rem",
        cursor: "pointer",
        padding: "0rem 0.6rem",
        overflowX:'hidden',
        height: "39px",
      }}
      >
      <div
        style={{
          borderRight: "1px solid gray",
          flex: '1 1 0',
          display: "flex",
          alignItems: "center",
          height: "100%",
          color: nameColor,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {user}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: "100%",
          flex: '2 1 0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {inbox.messages.length > 0 ? (
          <div
            style={{
              overflow: 'hidden',
            }}
          >
            {inbox.messages[inbox.messages.length - 1].message}
          </div>
        ) : (
          <div>
            no messages yet
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxPreview;
