import * as React from 'react';
import {useRef, useState, useEffect, useCallback} from 'react';
import ChatInput from './ChatInput';
import ChatHeader from './ChatHeader';
import useChatStore, { ChatState, ChatMessage } from '@dartfrog/puddle/store/service';
import Split from 'react-split';
import './ChatBox.css';
import { dfLinkRegex, dfLinkToRealLink, getPeerNameColor, nodeProfileLink } from '@dartfrog/puddle';
import ProfilePicture from './ProfilePicture';
import DisplayUserActivity from './DisplayUserActivity';

interface ChatBoxProps {
  chatState: ChatState;
}

const SplitComponent = Split as unknown as React.FC<any>;

const ChatBox: React.FC<ChatBoxProps> = ({ chatState }) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLDivElement | null>(null);
  const [inputHeight, setInputHeight] = useState(0);
  const [chatMessageList, setChatMessageList] = useState<Array<ChatMessage>>([]);

  const {peerMap, chatSoundsEnabled} = useChatStore();

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

  const baseOrigin = window.origin.split(".").slice(1).join(".")
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
              className="link puddle"
              style={{
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: "1rem",
              }}
              href={message}
            >
              {message}
            </a>
          </span>
        );
      } else if (dfLinkRegex.test(message)) {
        const realLink = dfLinkToRealLink(message, baseOrigin)
        return (
          <span>
            <a
              style={{
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: "1rem",
              }}
              href={realLink}
              className="link puddle"
            >
              {message}
            </a>
          </span>
        );

      } else {
        return <span>{message.replace(/\s+/g, ' ')}</span>;
      }
    },
    [scrollDownChat]
  );

  return (
    <div
    style={{
      width: "100%",
      maxWidth: "100%",
      height: "100%",
      maxHeight: "100%",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
      lineHeight: 1.5,
      fontWeight: 400,
      colorScheme: "dark",
      color: "#d1d1d1",
      backgroundColor: "#242424",
      fontSynthesis: "none",
      textRendering: "optimizeLegibility",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    }}
    >
      <div>
        <ChatHeader />
      </div>

      <div
        style={{
          flexGrow:"1",
          height:"100%",
          maxHeight:"100%",
          overflow:"hidden",
        }}
      >
        <SplitComponent
          sizes={[95, 5]}
          minSize={45}
          direction="vertical"
          style={{
            flexGrow:"1",
            height:"100%",
            maxHeight:"100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              overflowY: "scroll",
              width:"100%",
              maxWidth:"100%",
              height:"100%",
              maxHeight:"100%",
              justifyContent: "flex-end",
              alignContent: "flex-end",
              alignItems: "flex-end",
              justifyItems: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                flexGrow: 1,
                flexDirection:"column",
                overflowY:"auto",
                paddingTop:"0.8rem",
              }}
            >
              {chatMessageList.map((message, index) => (
                <div key={index}
                  className='chat-message'
                  style={{
                    display:"flex",
                    flexDirection:"row",
                    width:"100%",
                    gap:"0.8rem",
                    padding: "10px 0rem",
                  }}
                >
                  <div
                    style={{
                      userSelect:"none",
                      paddingLeft: "10px",
                    }}
                  >
                    <a
                      href={nodeProfileLink(message.from, baseOrigin)}
                      className="puddle"
                    >
                    <ProfilePicture size="40px" node={message.from} />
                    </a>
                  </div>
                  <div
                    style={{
                      display:"flex",
                      flexDirection:"column",
                      width:"100%",
                      gap: "3px",
                    }}
                  >
                    <div style={{ verticalAlign: "top",  lineHeight: "0.9" }}>
                      <a style={{ display: "inline-block", marginRight: "8px", cursor: "pointer", fontSize: "0.9rem" }}
                        className={`${getPeerNameColor(peerMap.get(message.from))} puddle`}
                        href={nodeProfileLink(message.from, baseOrigin)}
                      >
                        <span>{message.from}:</span>
                      </a>
                      <div style={{ userSelect: "none", color: "#ffffff77", fontSize: "0.7rem", display: "inline-block", marginRight: "5px", cursor: "default" }}>
                        <span>{formatTimestamp(message.time)}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.9rem", cursor: "default", wordWrap: "break-word", overflowWrap: "break-word", whiteSpace: "pre-wrap" }}>
                      {getMessageInnerText(message.msg)}
                    </span>
                  </div>
                </div>
              ))}
              <div id="messages-end-ref" ref={messagesEndRef} style={{ display: "inline" }} />
            </div>
          </div>
          <div
            ref={chatInputRef}
            style={{
              width: "100%",
              maxWidth: "100%",
            }}
          >
            <ChatInput />
          </div>
        </SplitComponent>
      </div>
    </div>
  );
};

export default React.memo(ChatBox);

export const linkRegex = /^https?:\/\/\S+$/i;
export const imageRegex = /^https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp)$/i;

export function isImageUrl(url: string) {
  return imageRegex.test(url);
}


export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000); // convert from seconds to milliseconds
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  if (date < oneWeekAgo) {
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(',', '');
  } else {
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const day = isToday ? 'Today' : isYesterday ? 'Yesterday' : date.toLocaleDateString('en-US', { weekday: 'short' });
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); // use 12-hour format with AM/PM and no leading zero
    return `${day} ${time}`;
  }
}