import React, { useCallback, useState } from 'react';
import { parseServiceId } from '@dartfrog/puddle';

interface ChatInputProps {
  serviceId: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ serviceId }) => {
  const [chatMessageInputText, setChatMessageInputText] = useState('');

  const handleInputChange = (event) => {
    setChatMessageInputText(event.target.value);
  };

  const sendChat = useCallback(
    async (event) => {
      event.preventDefault();
      if (!chatMessageInputText) return;
      console.log("todo send chat")
    },
    [chatMessageInputText]
  );


  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <textarea
        style={{
          flexGrow: 1,
          fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
          marginRight: '0px',
          resize: 'vertical',
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
      <div>
      <button style={{ cursor: 'pointer', height: '100%' }} onClick={sendChat}>
        Send
      </button>
      </div>
    </div>
  );
};

export default ChatInput;
