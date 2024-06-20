import React, { useCallback, useEffect, useRef, useState } from 'react';
import ChatInput from './ChatInput';
import { Service, ServiceId, makeServiceId, computeColorForName } from '@dartfrog/puddle';
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
  const pageBottomRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLDivElement | null>(null);
  const [inputHeight, setInputHeight] = useState(0);
  const { nameColors, addNameColor } = useChatStore();
  const [chatMessageList, setChatMessageList] = useState<Array<ChatMessage>>([]);

  useEffect(() => {
    const updateInputHeight = () => {
      if (chatInputRef.current) {
        setInputHeight(chatInputRef.current.offsetHeight + 6);
      }
    };
    updateInputHeight(); // Update on mount
  }, []);

  useEffect(() => {
    // Precompute name colors for all messages
    chatMessageList.forEach(message => {
      if (!nameColors[message.from]) {
        const color = computeColorForName(message.from);
        addNameColor(message.from, color);
      }
    });
  }, [chatMessageList, nameColors, addNameColor]);

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
              maxHeight: "9rem",
              objectFit: "cover",
              maxWidth: "100%",
            }}
            onLoad={scrollDownChat} // Use onLoad event to trigger scrollDownChat
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

  return (
    <>
      <div
        style={{
          height: `calc(100vh - ${inputHeight}px)`,
          paddingBottom: `${inputHeight}px`,
        }}
      >
      <div
        style={{
          overflowY: "scroll",
          overflowX: "hidden",
          boxSizing: "border-box",
          alignContent: "flex-end",
          position: 'relative',
          height: '100%',
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", backgroundColor: "#242424" }}>
          {chatMessageList.map((message, index) => (
            <div key={index} className='chat-message'>
              <div style={{ display: "inline-block", verticalAlign: "top" }}>
                <div style={{ color: "#ffffff77", fontSize: "0.8rem", display: "inline-block", marginRight: "5px", cursor: "default" }}>
                  <span>{formatTimestamp(message.time)}</span>
                </div>
                <div style={{ color: nameColors[message.from] || '#000', display: "inline-block", marginRight: "5px", cursor: "default" }}>
                  <span>{message.from}:</span>
                </div>
              </div>
              <span style={{ cursor: "default" }}>
                {getMessageInnerText(message.msg)}
              </span>
            </div>
          ))}
        </div>
        <div id="messages-end-ref" ref={messagesEndRef} style={{ display: "inline" }} />
      </div>
      </div>
      <div className="chat-input-container" ref={chatInputRef}>
        <ChatInput serviceId={serviceId} />
      </div>
    </>
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
