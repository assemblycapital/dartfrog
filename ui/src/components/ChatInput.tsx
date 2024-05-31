import React, { useCallback, useState } from 'react';
import { sendPoke } from '../utils';

const ChatInput = () => {
  const [chatMessageInputText, setChatMessageInputText] = useState('');

  const handleInputChange = (event) => {
    setChatMessageInputText(event.target.value);
  };

  const sendChat = useCallback(
    async (event) => {
      event.preventDefault();
      if (!chatMessageInputText) return;

      // Create a message object
      const data = { "ClientRequest": { "SendToServer": { "ChatMessage": chatMessageInputText } } };
      sendPoke(data);
      setChatMessageInputText("");
    },
    [chatMessageInputText]
  );


  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <textarea
        style={{
          flexGrow: 1,
          fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
        }}
        id="chat-input"
        value={chatMessageInputText}
        onChange={handleInputChange}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendChat(event);
          }
        }}
      />
      <button style={{ cursor: 'pointer' }} onClick={sendChat}>
        Send
      </button>
    </div>
  );
};

export default ChatInput;
