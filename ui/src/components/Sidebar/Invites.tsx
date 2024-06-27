import React from 'react';

interface InvitesProps {
}

const Invites: React.FC<InvitesProps> = ({ }) => {
    return (
        <div className="invites">
            <ul>
                <li className="pending">Invite 1</li>
                <li className="accepted">Invite 2</li>
                <li className="pending">Invite 3</li>
            </ul>
        </div>
    );
};

export default Invites;
