import { getPeerNameColor, PublicServiceMetadata, Service, ServiceID, ServiceMetadata } from '@dartfrog/puddle/index';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import useChatStore from '../store/service';

interface DisplayUserActivityProps {
  metadata: PublicServiceMetadata;
}

const DisplayUserActivity: React.FC<DisplayUserActivityProps> = ({metadata}) => {

  const [groupedUsers, setGroupedUsers] = useState({ online: [], recentlyOnline: [], ever: [] });

  const {peerMap} = useChatStore();

  const activityStatus = (isSubscribed, lastActivityTime, currentTime) => {
    const tenMinutes = 3 * 60 * 1000; // 3 minutes in milliseconds
    const oneDay = 24 * 60 * 60 * 1000; // 1 day in milliseconds


    if (isSubscribed) {
        return 'online';
    } else if (currentTime - lastActivityTime <= oneDay) {
        return 'recentlyOnline';
    } else {
        return 'ever';
    }
  };

  useEffect(() => {
    if (!metadata) return;
    const time = Date.now();

    const newGroupedUsers = Array.from(metadata.user_presence || []).reduce(
      (groups, [key, lastActivityTime]) => {
        const isSubscribed = metadata.subscribers?.includes(key) || false;
        const status = activityStatus(isSubscribed, lastActivityTime*1000, time);
        groups[status].push(key);
        return groups;
      },
      { online: [], recentlyOnline: [], ever: [] } 
    );
    setGroupedUsers(newGroupedUsers);
    // Sort each group by last activity time, descending
    const sortByLastActivityTimeDesc = (a, b) => b.time - a.time;

    newGroupedUsers.online.sort(sortByLastActivityTimeDesc);
    newGroupedUsers.recentlyOnline.sort(sortByLastActivityTimeDesc);
    newGroupedUsers.ever.sort(sortByLastActivityTimeDesc);

    // Map the groups to just user names
    setGroupedUsers({
      online: newGroupedUsers.online.map(user => user),
      recentlyOnline: newGroupedUsers.recentlyOnline.map(user => user),
      ever: newGroupedUsers.ever.map(user => user)
    });
  }, [metadata]);

  return (
    <div style={{
      color: '#ffffff77',
      fontSize: '0.8rem',
      cursor: 'default',
      userSelect: "none",
    }}>
      <div>
        <span style={{fontSize: '0.8rem'}}>{groupedUsers.online.length} online: </span>
        {groupedUsers.online.map((userId, index) => (
          <span key={index} style={{ userSelect: 'text'}}
            className={getPeerNameColor(peerMap.get(userId))}
          >
            {userId}
            {index < groupedUsers.online.length - 1 ? ', ' : ''}
          </span>
        ))}
      </div>
      <div>
        <span style={{fontSize: '0.8rem'}}>{groupedUsers.recentlyOnline.length} recently online: </span>
        {groupedUsers.recentlyOnline.map((userId, index) => (
          <span key={index}
            style={{
              userSelect: 'text',
            }}
          >
            {userId}{index < groupedUsers.recentlyOnline.length - 1 ? ', ' : ''}</span>
        ))}
      </div>
      <div>
        <span style={{fontSize: '0.8rem'}}>{groupedUsers.ever.length} others: </span>
        {groupedUsers.ever.map((userId, index) => (
          <span key={index}
            style={{
              userSelect: 'text',
            }}
          >{userId}{index < groupedUsers.ever.length - 1 ? ', ' : ''}</span>
        ))}
      </div>
    </div>
  );
};

export default DisplayUserActivity;