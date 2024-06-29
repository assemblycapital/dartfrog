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
      className="inbox-preview"
      style={{
        display:"flex",
        flexDirection: "row",
        gap: "0.8rem",
        cursor: "pointer",
        padding: "0rem 0.6rem",
      }}
      >
      <div
        style={{
          borderRight: "1px solid gray",
          flex:1,
          display: "flex",
          padding: "0.5rem 1rem 0.5rem 0rem",
          alignItems: "center",
          color: nameColor, // Apply the name color
        }}
      >
        {user}
      </div>
      <div
        style={{
          display: "flex",
          padding: "0.5rem 1rem 0.5rem 0rem",
          alignItems: "center",
          flex: 1,
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
