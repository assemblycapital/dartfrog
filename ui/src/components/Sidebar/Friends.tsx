import React from 'react';

interface FriendsProps {
}

const Friends: React.FC<FriendsProps> = ({ }) => {
    return (
        <div className=""
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              padding: '5rem 0rem',
            }}
          >
            coming soon
          </div>
        </div>
    );
};

export default Friends;