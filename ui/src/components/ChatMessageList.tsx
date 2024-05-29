import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChatMessage, ChatMessageHistory } from '../types/types';
import useChatStore from '../store/chat';
import { computeColorForName } from '../utils';

interface ChatMessageListProps {
  chats: ChatMessageHistory
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ chats }) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { nameColors, addNameColor } = useChatStore();
  const [ chatMessageList, setChatMessageList ] = useState<Array<ChatMessage>>([]);

  const getNameColor = useCallback(
    (name: string) => {
    let color = nameColors[name];
    if (color) {
      return color
    }
    color = computeColorForName(name);
    addNameColor(name, color);
    return color;
  }
  , [nameColors])

  useEffect(() => {
    if (chats.size == 0) return;
    if (!chats.values) return;
    const sortedMessages = Array.from(chats.values()).sort((a, b) => a.id - b.id);
    setChatMessageList(sortedMessages);

  }, [chats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollDownChat();
    }, 100); // Adjust the delay as needed

    return () => clearTimeout(timer); // Clean up the timer on component unmount
  }, []);

  const scrollDownChat = useCallback(
    async () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesEndRef, chatMessageList]);

  useEffect(() => {
    scrollDownChat();
  }, [chats, scrollDownChat]);



  return (
      <div
        style={{
          height: "400px",
          maxHeight: "400px",
          overflowY: "scroll",
          overflowX: "hidden",
          backgroundColor: "#202020",
          margin: "10px 0px",
          boxSizing: "border-box",
          alignContent: "flex-end",
        }}
      >
        <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          backgroundColor: "#242424",
        }}
        >
          {chatMessageList.map((message, index) => (
            <div key={index} style={{
              wordWrap: "break-word",
            }}>
              <div style={{color:"#ffffff77", fontSize: "0.8rem", display: "inline-block", marginRight:"5px", cursor: "default"}}>
                <span>{formatTimestamp(message.time)}</span>
              </div>
              <div style={{color: getNameColor(message.from), display: "inline-block", marginRight:"5px"}}>
                <span>{message.from}:</span>
              </div>
                <span>{message.msg}</span>
            </ div>
            ))}
          <div id="messages-end-ref" ref={messagesEndRef} 
            style={{display:"inline"}}
          /> 
        </div>
      </div>
  );
};

export default React.memo(ChatMessageList);

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000); // convert from seconds to milliseconds
  const day = date.toLocaleDateString('en-US', { weekday: 'short' });
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${day} ${time}`;
}