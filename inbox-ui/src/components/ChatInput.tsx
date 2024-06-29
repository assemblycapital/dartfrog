import React, { useCallback, useState } from 'react';
import { parseServiceId } from '@dartfrog/puddle';
import useInboxStore, { PLUGIN_NAME } from '../store/inbox';
import { maybeReplaceWithImage } from '../utils';

interface ChatInputProps {
  user:string,
}

const ChatInput: React.FC<ChatInputProps> = ({ user, }) => {
  const [chatMessageInputText, setChatMessageInputText] = useState('');
  const {sendMessage} = useInboxStore();

  const handleInputChange = (event) => {
    setChatMessageInputText(event.target.value);
  };

  const sendChatCallback = useCallback(
    async (event) => {
      event.preventDefault();
      if (!chatMessageInputText) return;
      let text = maybeReplaceWithImage(chatMessageInputText);
      sendMessage(user, text);
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
            sendChatCallback(event);
          }
        }}
      />
      <div>
      <button style={{ cursor: 'pointer', height: '100%' }} onClick={sendChatCallback}>
        Send
      </button>
      </div>
    </div>
  );
};

export default ChatInput;
