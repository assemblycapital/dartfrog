import { useCallback, useEffect, useState } from 'react';
import { computeColorForName } from '@dartfrog/puddle';
import useDartStore from '../store/dart';

interface DisplayUserActivityProps {
  // serviceId: ServiceId;
  // metadata: ServiceMetadata;
}

const DisplayUserActivity: React.FC<DisplayUserActivityProps> = ({}) => {

  // const { userActivity, nameColors, addNameColor } = useChatStore();
  const [groupedUsers, setGroupedUsers] = useState({ online: [], recentlyOnline: [], ever: [] });

  // const { nameColors, addNameColor } = useDartStore();

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

  // useEffect(() => {
  //   const time = Date.now();

    // const newGroupedUsers = Object.entries(metadata.user_presence).reduce(
    //   (groups, [key, activity]) => {
    //       let isSubscribed = metadata.subscribers.includes(key);
    //       const status = activityStatus(isSubscribed, activity.time * 1000, time);
    //       groups[status].push(key);
    //       return groups;
    //   },
    //   { online: [], recentlyOnline: [], ever: [] }
    // );
    // setGroupedUsers(newGroupedUsers);
    // Sort each group by last activity time, descending
    // const sortByLastActivityTimeDesc = (a, b) => b.time - a.time;

    // newGroupedUsers.online.sort(sortByLastActivityTimeDesc);
    // newGroupedUsers.recentlyOnline.sort(sortByLastActivityTimeDesc);
    // newGroupedUsers.ever.sort(sortByLastActivityTimeDesc);

    // // Map the groups to just user names
    // setGroupedUsers({
    //   online: newGroupedUsers.online.map(user => user.name),
    //   recentlyOnline: newGroupedUsers.recentlyOnline.map(user => user.name),
    //   ever: newGroupedUsers.ever.map(user => user.name)
    // });
  // }, [metadata]);

  // const getNameColor = useCallback(
  //   (name: string) => {
  //   let color = nameColors[name];
  //   if (color) {
  //     return color
  //   }
  //   color = computeColorForName(name);
  //   addNameColor(name, color);
  //   return color;
  // }
  // , [nameColors])

  return (
    <div style={{color: '#ffffff77', fontSize: '0.8rem', cursor: 'default',
      userSelect: "none",
    }}>
      <div>
        <span style={{fontSize: '0.8rem'}}>{groupedUsers.online.length} online: </span>
        {groupedUsers.online.map((userId, index) => (
          <span key={index} style={{ userSelect: 'text'}}>
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
