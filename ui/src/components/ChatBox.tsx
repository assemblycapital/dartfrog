import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChatMessage, ChatMessageHistory } from '../types/types';
import { computeColorForName } from '../utils';
import ChatInput from './ChatInput';
import { Service, ServiceId, makeServiceId } from '../dartclientlib/';

import useDartStore from "../store/dart";
import { ChatState } from '../dartclientlib/chat';
import Spinner from './Spinner';

interface ChatBoxProps {
  serviceId: ServiceId;
  chatState: ChatState;
}

const ChatBox: React.FC<ChatBoxProps> = ({ serviceId, chatState }) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isResizing = useRef(false);

  const { nameColors, addNameColor } = useDartStore();
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
    const sortedMessages = Array.from(chatState.messages.values()).sort((a, b) => a.id - b.id);
    setChatMessageList(sortedMessages);
  }, [chatState.messages]);

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
      const newHeight = e.clientY - containerRef.current.getBoundingClientRect().top - 65;
      if (newHeight > 100) {
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
      <ChatInput serviceId={serviceId} />
      <div
        style={{
          height: '8px',
          background: '#333',
          cursor: 'row-resize',
          width: '100%',
        }}
        onMouseDown={startResizing}
      />
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
