import React, { useCallback, useEffect, useRef, useState } from 'react';
import ChatInput from './ChatInput';
import ChatHeader from './ChatHeader';
import useChatStore, { ChatState, ChatMessage} from '../store/chat';
import './ChatBox.css';

interface ChatBoxProps {
  chatState: ChatState;
}

const ChatBox: React.FC<ChatBoxProps> = ({ chatState }) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLDivElement | null>(null);
  const [inputHeight, setInputHeight] = useState(0);
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
    if (chatState.messages.size === 0) return;
    if (!(chatState.messages instanceof Map)) {
      return;
    }

    const sortedMessages = Array.from(chatState.messages.values()).sort((a, b) => a.id - b.id);
    setChatMessageList(sortedMessages);
  }, [chatState.messages]);

  const scrollDownChat = useCallback(() => {
    if (messagesEndRef.current) {
      let behavior = "auto";
      if (chatState.lastUpdateType === "message") {
        behavior = "smooth";
      }
      messagesEndRef.current.scrollIntoView({ behavior: behavior as ScrollBehavior, block: 'nearest', inline: 'start' });
    }
  }, [messagesEndRef, chatState.lastUpdateType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollDownChat();
    }, 100);
    return () => clearTimeout(timer);
  }, [chatMessageList, scrollDownChat]);

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
            onLoad={scrollDownChat}
          />
        );
      } else if (linkRegex.test(message)) {
        return (
          <span>
            <a
              style={{
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: "1rem",
              }}
              onClick={() => {
                window.parent.postMessage({type: 'open-http-url', url:message}, '*');
              }}
            >
              {message}
            </a>
          </span>
        );
      } else if (dfLinkRegex.test(message)) {
        return (
          <span>
            <a
              style={{
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: "1rem",
              }}
              onClick={() => {
                window.parent.postMessage({type: 'open-df-service', url:message}, '*');
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
    <div className="chat-box">
      <div className="chat-header">
        <ChatHeader />
      </div>
      <div className="chat-container">
        <div className="chat-messages" style={{ paddingBottom: `${inputHeight}px` }}>
          {chatMessageList.map((message, index) => (
            <div key={index} className='chat-message'>
              <div style={{ display: "inline-block", verticalAlign: "top" }}>
                <div style={{ color: "#ffffff77", fontSize: "0.8rem", display: "inline-block", marginRight: "5px", cursor: "default" }}>
                  <span>{formatTimestamp(message.time)}</span>
                </div>
                <div style={{ display: "inline-block", marginRight: "5px", cursor: "default" }}>
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
      <div className="chat-input-container" ref={chatInputRef}>
        <ChatInput />
      </div>
    </div>
  );
};

export default React.memo(ChatBox);

const dfLinkRegex = /^df:\/\/[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.([a-zA-Z0-9]+\.)+[a-zA-Z]+$/;

const linkRegex = /^https?:\/\/\S+$/i;
const imageRegex = /^https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp)$/i;

function isImageUrl(url: string) {
  return imageRegex.test(url);
}

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