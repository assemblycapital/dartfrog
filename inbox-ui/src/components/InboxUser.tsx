import React, { useEffect, useState } from 'react';
import { Inbox } from '../store/inbox';
import useInboxStore from '../store/inbox';  // Import useInboxStore
import { computeColorForName } from '@dartfrog/puddle';

interface InboxUserProps {
  user: string;
  inbox: Inbox;
  goBack: ()=>void;
}

const InboxUser: React.FC<InboxUserProps> = ({ user, inbox, goBack}) => {
  const { nameColors } = useInboxStore();
  const [nameColor, setNameColor] = useState<string>('');

  useEffect(() => {
    let color = nameColors[user];
    if (!color) {
      color = computeColorForName(user)
    }
    setNameColor(color)
  }, [nameColors, user]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', color: nameColor }}>
        <button onClick={goBack} style={{ marginRight: '10px' }}>Back</button>
        {user}
      </div>
      <ul>
        {inbox.messages.map((message, index) => (
          <li key={index}>
            <p><strong>Sender:</strong> {message.sender}</p>
            <p><strong>Message:</strong> {message.message}</p>
            <p><strong>Time:</strong> {new Date(message.time).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InboxUser;