import React, { useCallback, useEffect, useRef, useState } from 'react';
import ChatInput from './ChatInput';
import { Service, ServiceId, makeServiceId, computeColorForName } from '@dartfrog/puddle';

// import Spinner from './Spinner';
import ChatHeader from './ChatHeader';
import useChatStore from '../store/chat';

type ChatState = {
  messages: Map<number, ChatMessage>;

}
type ChatMessage = {
  id: number;
  from: string;
  msg: string;
  time: number;

}
interface ChatBoxProps {
  serviceId: ServiceId;
  chatState: ChatState;
}

const ChatBox: React.FC<ChatBoxProps> = ({ serviceId, chatState }) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLDivElement | null>(null);  // Reference for ChatInput
  const isResizing = useRef(false);

  const { nameColors, addNameColor } = useChatStore();
  const [chatMessageList, setChatMessageList] = useState<Array<ChatMessage>>([]);
  const [containerHeight, setContainerHeight] = useState(400);

  const getNameColor = useCallback(
    (name: string) => {
      let color = nameColors[name];
      if (color) {
        return color;
      }
      color = computeColorForName(name);
      addNameColor(name, color);
      return color;
    },
    [nameColors, addNameColor]
  );

  useEffect(() => {
    if (chatState.messages.size === 0) return;
    if (!(chatState.messages instanceof Map)) {
      return;
    }

    const sortedMessages = Array.from(chatState.messages.values()).sort((a, b) => a.id - b.id);
    setChatMessageList(sortedMessages);
  }, [serviceId, chatState.messages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollDownChat();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollDownChat = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: 'nearest', inline: 'start' });
    }
  }, [messagesEndRef]);

  useEffect(() => {
    scrollDownChat();
  }, [chatMessageList, scrollDownChat]);

  const getMessageInnerText = useCallback(
    (message: string) => {
      if (isImageUrl(message)) {
        return (
          <img
            src={message}
            alt="chat image"
            style={{
              height: "100%",
              maxHeight: "12vh",
              objectFit: "cover",
              maxWidth: "100%",
            }}
            onLoad={() => scrollDownChat()}
          />
        );
      } else if (linkRegex.test(message)) {
        return (
          <span>
            <a
              href={message}
              style={{
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              {message}
            </a>
          </span>
        );
      } else {
        return <span>{message}</span>;
      }
    },
    [scrollDownChat]
  );

  const startResizing = (e: React.MouseEvent) => {
    isResizing.current = true;
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
  };

  const resize = (e: MouseEvent) => {
    if (isResizing.current && containerRef.current) {
      const containerTop = containerRef.current.getBoundingClientRect().top;
      const chatInputHeight = chatInputRef.current ? chatInputRef.current.offsetHeight : 0;

      // Dynamically calculate gap size in pixels
      const style = window.getComputedStyle(containerRef.current);
      const gap = parseFloat(style.gap) || 0;

      // Consider the gap in the height calculation
      const newHeight = e.clientY - containerTop - chatInputHeight - 2 * gap; // gap above and below ChatInput

      if (newHeight > 100) { // Minimum height check
        setContainerHeight(newHeight);
      }
    }
  };

  

  const stopResizing = () => {
    isResizing.current = false;
    window.removeEventListener('mousemove', resize);
    window.removeEventListener('mouseup', stopResizing);
  };

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
      <div
        style={{
          height: `${containerHeight}px`,
          overflowY: "scroll",
          overflowX: "hidden",
          backgroundColor: "#202020",
          boxSizing: "border-box",
          alignContent: "flex-end",
          position: 'relative',
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", backgroundColor: "#242424" }}>
          {chatMessageList.map((message, index) => (
            <div key={index} className='chat-message'>
              <div style={{ display: "inline-block", verticalAlign: "top" }}>
                <div style={{ color: "#ffffff77", fontSize: "0.8rem", display: "inline-block", marginRight: "5px", cursor: "default" }}>
                  <span>{formatTimestamp(message.time)}</span>
                </div>
                <div style={{ color: getNameColor(message.from), display: "inline-block", marginRight: "5px", cursor: "default" }}>
                  <span>{message.from}:</span>
                </div>
              </div>
              <span style={{ cursor: "default" }}>
                {getMessageInnerText(message.msg)}
              </span>
            </div>
          ))}
          <div id="messages-end-ref" ref={messagesEndRef} style={{ display: "inline" }} />
        </div>
      </div>
      <div ref={chatInputRef}>
        <ChatInput serviceId={serviceId} />
      </div>
      {/* <div
        style={{
          height: '8px',
          background: '#333',
          cursor: 'row-resize',
          width: '100%',
        }}
        onMouseDown={startResizing}
      /> */}
    </div>
  );
};

export default React.memo(ChatBox);

const linkRegex = /^https?:\/\/\S+$/i;
const imageRegex = /^https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp)$/i;

function isImageUrl(url: string) {
  return imageRegex.test(url);
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000); // convert from seconds to milliseconds
  const day = date.toLocaleDateString('en-US', { weekday: 'short' });
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${day} ${time}`;
}
