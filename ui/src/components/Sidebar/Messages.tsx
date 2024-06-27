import React from 'react';

interface MessagesProps {
}

const Messages: React.FC<MessagesProps> = ({ }) => {
    return (
        <div className="messages">
            <ul>
                <li className="unread">Message 1</li>
                <li className="read">Message 2</li>
                <li className="unread">Message 3</li>
            </ul>
        </div>
    );
};

export default Messages;
