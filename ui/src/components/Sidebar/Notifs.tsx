import React from 'react';

interface NotifsProps {
}

const Notifs: React.FC<NotifsProps> = ({}) => {
    return (
        <div className="notifs">
            <ul>
                <li className="unread">Notification 1</li>
                <li className="read">Notification 2</li>
                <li className="unread">Notification 3</li>
            </ul>
        </div>
    );
};

export default Notifs;
