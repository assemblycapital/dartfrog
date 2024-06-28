import React from 'react';

interface SettingsProps {
}

const Settings: React.FC<SettingsProps> = ({ }) => {
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

export default Settings;
