import React, { useCallback, useEffect, useState } from 'react';
import useChatStore from '../store/chat';
import { computeColorForName } from '../utils';

const DisplayUserActivity = () => {

  const { userActivity, nameColors, addNameColor } = useChatStore();
  const [groupedUsers, setGroupedUsers] = useState({ online: [], recentlyOnline: [], ever: [] });

  const activityStatus = (lastActivityTime, currentTime) => {
    const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
    const oneDay = 24 * 60 * 60 * 1000; // 1 day in milliseconds

    if (currentTime - lastActivityTime <= tenMinutes) {
        return 'online';
    } else if (currentTime - lastActivityTime <= oneDay) {
        return 'recentlyOnline';
    } else {
        return 'ever';
    }
  };

  useEffect(() => {
    const time = Date.now();
    const newGroupedUsers = userActivity.reduce(
        (groups, activity) => {
            const status = activityStatus(activity.time*1000, time);
            groups[status].push(activity.name);
            return groups;
        },
        { online: [], recentlyOnline: [], ever: [] }
    );
    setGroupedUsers(newGroupedUsers);
  }, [userActivity]);

  const getNameColor = useCallback(
    (name: string) => {
    let color = nameColors[name];
    if (color) {
      return color
    }
    color = computeColorForName(name);
    addNameColor(name, color);
    return color;
  }
  , [nameColors])

  return (
    <div style={{ marginTop: '12px', color: '#ffffff77' }}>
      <div>
        <span>{groupedUsers.online.length} online: </span>
        {groupedUsers.online.map((userId, index) => (
          <span key={index} style={{ color: getNameColor(userId) }}>
            {userId}
            {index < groupedUsers.online.length - 1 ? ', ' : ''}
          </span>
        ))}
      </div>
      <div>
        <span>{groupedUsers.recentlyOnline.length} recently online: </span>
        {groupedUsers.recentlyOnline.map((userId, index) => (
          <span key={index}>{userId}{index < groupedUsers.recentlyOnline.length - 1 ? ', ' : ''}</span>
        ))}
      </div>
      <div>
        <span>{groupedUsers.ever.length} others: </span>
        {groupedUsers.ever.map((userId, index) => (
          <span key={index}>{userId}{index < groupedUsers.ever.length - 1 ? ', ' : ''}</span>
        ))}
      </div>
    </div>
  );
};

export default DisplayUserActivity;
