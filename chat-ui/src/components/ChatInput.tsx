import React, { useCallback, useState } from 'react';
import { parseServiceId } from '@dartfrog/puddle';
import useChatStore, { PLUGIN_NAME } from '../store/chat';

interface ChatInputProps {
  serviceId: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ serviceId }) => {
  const [chatMessageInputText, setChatMessageInputText] = useState('');
  const {api} = useChatStore();

  const handleInputChange = (event) => {
    setChatMessageInputText(event.target.value);
  };

  const sendChat = useCallback(
    async (event) => {
      event.preventDefault();
      if (!chatMessageInputText) return;
      const innerPluginRequest = {
        SendMessage: chatMessageInputText,
      };
      api.pokePlugin(serviceId, PLUGIN_NAME, innerPluginRequest);

      setChatMessageInputText('');
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
