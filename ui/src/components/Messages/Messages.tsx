import React, { useCallback, useEffect, useState } from 'react';
import CurrentPageHeader from '../CurrentPageHeader';
import useDartStore, { DirectMessage } from '../../store/dart';
import { useNavigate } from 'react-router-dom';
import ProfilePicture from '../ProfilePicture';
import { getPeerNameColor } from '@dartfrog/puddle/index';
import { formatTimestamp } from '@dartfrog/puddle/components/ChatBox';

export const hasUnreadHistory = (history: DirectMessage[]) => {
  return history.some(message => message.is_unread);
};

const Messages: React.FC = () => {
    const {setCurrentPage, messageStoreMap, peerMap} = useDartStore();
    useEffect(()=>{
        setCurrentPage('messages')
    }, [])

    const [inputValue, setInputValue] = useState('');

    const navigate = useNavigate();


    const handleSubmit = useCallback(() => {
        if (inputValue === "") return;
        navigate(`/messages/${inputValue}`)
    }, [inputValue]);


    const getLatestMessageContents = (history: DirectMessage[]) => {
        if (history.length === 0) return "";
        const latestMessage = history.reduce((latest, current) => 
            current.time_received > latest.time_received ? current : latest
        );
        return latestMessage.contents

    }
    const getLatestTimestampUnformatted = (history: DirectMessage[]) => {
      if (history.length === 0) return null;
      const latestMessage = history.reduce((latest, current) => 
          current.time_received > latest.time_received ? current : latest
      );
      return latestMessage.time_received;
  };
    const getLatestTimestamp = (history: DirectMessage[]) => {
        if (history.length === 0) return "";
        const latestMessage = history.reduce((latest, current) => 
            current.time_received > latest.time_received ? current : latest
        );
        return formatTimestamp(latestMessage.time_received)
    };

    const sortedEntries = React.useMemo(() => {
        return Array.from(messageStoreMap.entries()).sort((a, b) => {
            const [aNode, aValue] = a;
            const [bNode, bValue] = b;
            
            // First, sort by unread messages
            const aHasUnread = hasUnreadHistory(aValue.history);
            const bHasUnread = hasUnreadHistory(bValue.history);
            if (aHasUnread && !bHasUnread) return -1;
            if (!aHasUnread && bHasUnread) return 1;
            
            // Then, sort by most recent message timestamp
            const aLatestTimestamp = getLatestTimestampUnformatted(aValue.history);
            const bLatestTimestamp = getLatestTimestampUnformatted(bValue.history);
            
            if (aLatestTimestamp !== null && bLatestTimestamp !== null) {
                return bLatestTimestamp - aLatestTimestamp;
            } else if (aLatestTimestamp !== null) {
                return -1; // a has a timestamp, b doesn't, so a comes first
            } else if (bLatestTimestamp !== null) {
                return 1;  // b has a timestamp, a doesn't, so b comes first
            }
            
            // If one or both histories are empty, use the existing sorting logic
            const aPeer = peerMap.get(aNode);
            const bPeer = peerMap.get(bNode);
            
            if (!aPeer && !bPeer) return 0;
            if (!aPeer) return 1;
            if (!bPeer) return -1;
            
            if (!aPeer.peerData && !bPeer.peerData) return 0;
            if (!aPeer.peerData) return 1;
            if (!bPeer.peerData) return -1;
            
            return 0;
        });
    }, [messageStoreMap, peerMap]);

    return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxHeight: "100%",
            height: "100%",
            overflowY: "hidden",
            overflowX:"hidden",
          }}
        >
            <div
              style={{
                marginTop: "1rem",
                flexShrink: 0,
                display: "flex",
                flexDirection: "row",
              }}
            >
                <input 
                  type="text" 
                  value={inputValue} 
                  placeholder='node-to-message.os'
                  onChange={(e) => setInputValue(e.target.value)} 
                  style={{
                    flexGrow:"1",
                  }}
                />
                <button onClick={handleSubmit}>new</button>
            </div>

            <div
              style={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                width: "100%",
                overflowY: "auto",
              }}
            >
                {sortedEntries.map(([node, value]) => (
                        <div key={node}
                          style={{
                            display:"flex",
                            flexDirection:"row",
                            width:"100%",
                            cursor:"pointer",
                            gap:"1rem",
                            padding:"8px",
                            overflowX:"hidden",
                            flexShrink:"0",
                          }}
                          className="hover-dark-gray"
                          onClick={()=>{
                            navigate(`/messages/${node}`)

                          }}

                        >
                             {hasUnreadHistory(value.history) &&
                              <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                              }}
                              className="name-color-blue"

                              >
                                ●
                              </div>
                            }
                            <div
                              style={{
                                minWidth: "48px",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <ProfilePicture size="48px" node={node} />
                            </div>
                           
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                              }}
                            >
                                <div
                                  className={getPeerNameColor(peerMap.get(node))}
                                  style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    gap: "1rem",
                                    alignItems: "center",
                                  }}
                                >
                                    <span>{node}</span>
                                    <span style={{ color: "gray", fontSize:"0.7rem"}}>
                                        {getLatestTimestamp(value.history)}
                                    </span>
                                </div>
                                <div style={{ 
                                    color: "gray",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    maxWidth: "100%"
                                }}>
                                    {getLatestMessageContents(value.history)}
                                </div>
                            </div>
                        </div>
                    ))}

            </div>
        </div>
    );
};

export default Messages;