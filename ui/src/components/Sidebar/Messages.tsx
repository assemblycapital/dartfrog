import React from 'react';

interface MessagesProps {
}

const Messages: React.FC<MessagesProps> = ({ }) => {
    return (
      <div className=""
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <iframe
        src={`/inbox:dartfrog:herobrine.os/?service=inbox.${window.our?.node}`}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
      />
    </div>
    );
};

export default Messages;
