import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Inbox } from '../store/inbox';
import useInboxStore from '../store/inbox';
import { computeColorForName } from '@dartfrog/puddle';
import ChatInput from './ChatInput';

interface InboxUserProps {
  user: string;
  inbox: Inbox;
  goBack: () => void;
}

const InboxUser: React.FC<InboxUserProps> = ({ user, inbox, goBack }) => {
  const { nameColors } = useInboxStore();
  const [nameColor, setNameColor] = useState<string>('');
  const [myNameColor, setMyNameColor] = useState<string>('');
  const [paddingTop, setPaddingTop] = useState<number>(0);
  const [paddingBottom, setPaddingBottom] = useState<number>(0);
  const topRowRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let color = nameColors[user];
    if (!color) {
      color = computeColorForName(user);
    }
    setNameColor(color);
  }, [nameColors, user]);

  useEffect(() => {
    let color = nameColors[window.our?.node];
    if (!color) {
      color = computeColorForName(window.our?.node);
    }
    setMyNameColor(color);
  }, [nameColors]);

  useEffect(() => {
    const topRowHeight = topRowRef.current?.offsetHeight || 0;
    const chatInputHeight = chatInputRef.current?.offsetHeight || 0;
    setPaddingTop(topRowHeight);
    setPaddingBottom(chatInputHeight);
  }, []);

  const scrollDownChat = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  }, [messagesEndRef]);

  useEffect(() => {
    scrollDownChat();
  }, [inbox, scrollDownChat]);

  return (
    <div>
      <div
        ref={topRowRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          gap: '0.5rem',
          borderBottom: '1px solid gray',
          marginBottom: '0.3rem',
          backgroundColor: '#242424',
          zIndex: 1000,
        }}
      >
        <div
          className="dm-back-button"
          style={{
            cursor: 'pointer',
            padding: '0.5rem 3rem',
          }}
          onClick={goBack}
        >
          back
        </div>
        <div style={{ color: nameColor, display: 'flex', alignItems: 'center' }}>{user}</div>
      </div>
      <ul
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          marginTop: `${paddingTop}px`,
          marginBottom: `${paddingBottom}px`,
          overflowY: 'auto',
        }}
      >
        {inbox.messages.map((message, index) => (
          <li key={index} className="chat-message">
            <div style={{ display: 'inline-block', verticalAlign: 'top' }}>
              <div style={{ color: '#ffffff77', fontSize: '0.8rem', display: 'inline-block', marginRight: '5px', cursor: 'default' }}>
                <span>{formatTimestamp(message.time)}</span>
              </div>
              <div style={{ color: message.sender === window.our?.node ? myNameColor : nameColors[message.sender] || '#ffffff', display: 'inline-block', marginRight: '5px', cursor: 'default' }}>
                <span>{message.sender}:</span>
              </div>
            </div>
            <span style={{ cursor: 'default' }}>{message.message}</span>
          </li>
        ))}
        <div ref={messagesEndRef} style={{ display: 'inline' }} />
      </ul>
      <div
        ref={chatInputRef}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          zIndex: 1000,
        }}
      >
        <ChatInput user={user} />
      </div>
    </div>
  );
};

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000); // convert from seconds to milliseconds
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  if (date < oneWeekAgo) {
    const month = date.getMonth() + 1; // getMonth() is zero-based
    const year = date.getFullYear().toString().slice(-2); // get last two digits of the year
    return `${month}/${year}`;
  } else {
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${day} ${time}`;
  }
}

export default InboxUser;
