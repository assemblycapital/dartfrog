import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Inbox } from '../store/inbox';
import useInboxStore from '../store/inbox';
import { computeColorForName } from '@dartfrog/puddle';
import ChatInput from './ChatInput';
import ChatBox from './ChatBox';

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
    <div
      style={{
        width:"100%",
        height:"100%"
      }}
    >
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
            padding: '0.5rem 0.5rem',
          }}
          onClick={goBack}
        >
          back
        </div>
        <div style={{ color: nameColor, display: 'flex', alignItems: 'center', userSelect: "none" }}>{user}</div>
      </div>
      <ChatBox user={user} inbox={inbox} />
    </div>
  );
}
export default InboxUser;
