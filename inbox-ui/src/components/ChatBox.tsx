import React, { useCallback, useEffect, useRef, useState } from 'react';
import ChatInput from './ChatInput';
import { Service, ServiceId, makeServiceId, computeColorForName } from '@dartfrog/puddle';
import useInboxStore, {Inbox, InboxMessage} from '../store/inbox';

interface ChatBoxProps {
  user: string;
  inbox: Inbox;
}

const ChatBox: React.FC<ChatBoxProps> = ({ user, inbox }) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pageBottomRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLDivElement | null>(null);
  const [inputHeight, setInputHeight] = useState(0);
  const { nameColors, addNameColor } = useInboxStore();
  const [chatMessageList, setChatMessageList] = useState<Array<InboxMessage>>([]);

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
    inbox.messages.forEach(message => {
      if (!nameColors[message.sender]) {
        const color = computeColorForName(message.sender);
        addNameColor(message.sender, color);
      }
    });
  }, [inbox, nameColors, addNameColor]);


  const scrollDownChat = useCallback(() => {
    if (messagesEndRef.current) {
      let behavior = "auto";
      messagesEndRef.current.scrollIntoView({ behavior: behavior as ScrollBehavior, block: 'nearest', inline: 'start' });
    }
  }, [messagesEndRef, inbox]);

  useEffect(() => {
    // add a slight delay... I dont remember why
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
            onLoad={scrollDownChat} // Use onLoad event to trigger scrollDownChat
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
    <>
      <div
        className="chat-container"
        style={{
          height: `calc(100vh - ${inputHeight}px)`,
          // paddingBottom: `${inputHeight}px`,
        }}
      >
      <div
        style={{
          overflowY: "auto",
          overflowX: "hidden",
          boxSizing: "border-box",
          alignContent: "flex-end",
          position: 'relative',
          height: '100%',
          paddingTop: `${inputHeight}px`,
          paddingRight: `18px`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", backgroundColor: "#242424" }}>
          {inbox.messages.map((message, index) => (
            <div key={index} className='chat-message'>
              <div style={{ display: "inline-block", verticalAlign: "top" }}>
                <div style={{ color: "#ffffff77", fontSize: "0.8rem", display: "inline-block", marginRight: "5px", cursor: "default" }}>
                  <span>{formatTimestamp(message.time)}</span>
                </div>
                <div style={{ color: nameColors[message.sender] || '#000', display: "inline-block", marginRight: "5px", cursor: "default" }}>
                  <span>{message.sender}:</span>
                </div>
              </div>
              <span style={{ cursor: "default" }}>
                {getMessageInnerText(message.message)}
              </span>
            </div>
          ))}
        </div>
        <div id="messages-end-ref" ref={messagesEndRef} style={{ display: "inline" }} />
      </div>
      </div>
      <div className="chat-input-container" ref={chatInputRef}>
        <ChatInput user={user} />
      </div>
    </>
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
