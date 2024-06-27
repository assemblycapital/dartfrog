import React from 'react';

interface FriendsProps {
}

const Friends: React.FC<FriendsProps> = ({ }) => {
    return (
        <div className="friends">
            <ul>
                <li>Friend 1</li>
                <li>Friend 2</li>
                <li>Friend 3</li>
            </ul>
        </div>
    );
};

export default Friends;