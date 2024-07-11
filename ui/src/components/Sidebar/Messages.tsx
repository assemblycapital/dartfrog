import React, { useEffect } from 'react';
import useDartStore from '../../store/dart';

interface MessagesProps {
}

const Messages: React.FC<MessagesProps> = ({ }) => {
    // const {addTab} = useDartStore();
    useEffect(() => {
        const messageListener = (event: MessageEvent) => {
            if (event.data.type === 'open-df-service') {
                const dialogKey = 'dialogShown-' + event.data.url;
                if (!sessionStorage.getItem(dialogKey)) {
                    let confirmed = window.confirm(`Open ${event.data.url}?`);
                    sessionStorage.setItem(dialogKey, 'true'); // Set flag in session storage
                    if (confirmed) {
                        let serviceId = event.data.url.slice(5, event.data.url.length);
                        // addTab(serviceId);
                    }
                    setTimeout(() => {
                        sessionStorage.removeItem(dialogKey); // Remove flag after a delay
                    }, 500); // Delay of 500 milliseconds
                }
            } else if (event.data.type === 'open-http-url') {
                const dialogKey = 'dialogShown-' + event.data.url;
                if (!sessionStorage.getItem(dialogKey)) {
                    let confirmed = window.confirm(`Open ${event.data.url}?`);
                    sessionStorage.setItem(dialogKey, 'true'); // Set flag in session storage
                    if (confirmed) {
                        window.open(event.data.url, '_blank');
                    }
                    setTimeout(() => {
                        sessionStorage.removeItem(dialogKey); // Remove flag after a delay
                    }, 500); // Delay of 500 milliseconds
                }
            }
        };

        window.addEventListener('message', messageListener);

        return () => {
            window.removeEventListener('message', messageListener);
        };
    }, []);

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
