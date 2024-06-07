import React, { useCallback, useState } from 'react';
import { maybeReplaceWithImage, } from '../utils';
import useDartStore from '../store/dart';
import { parseServiceId } from '../dartclientlib';

interface ChatInputProps {
  serviceId: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ serviceId }) => {
  const [chatMessageInputText, setChatMessageInputText] = useState('');

  const { pokeService } = useDartStore();
  const handleInputChange = (event) => {
    setChatMessageInputText(event.target.value);
  };

  const sendChat = useCallback(
    async (event) => {
      event.preventDefault();
      if (!chatMessageInputText) return;

      // Create a message object
      let text = maybeReplaceWithImage(chatMessageInputText);
      const data = {
          "SendMessage": 
            text
        }
      // sendPoke(data);
      setChatMessageInputText("");

      let parsedServiceId = parseServiceId(serviceId);

      pokeService(parsedServiceId, data);
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
