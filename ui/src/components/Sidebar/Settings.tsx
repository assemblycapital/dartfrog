import React from 'react';

interface SettingsProps {
}

const Settings: React.FC<SettingsProps> = ({ }) => {
    return (
        <div className="settings">
            <ul>
                <li>Profile Settings</li>
                <li>Account Settings</li>
                <li>Privacy Settings</li>
            </ul>
        </div>
    );
};

export default Settings;
