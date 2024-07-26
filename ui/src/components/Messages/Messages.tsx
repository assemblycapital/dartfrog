import React, { useCallback, useEffect, useState } from 'react';
import CurrentPageHeader from '../CurrentPageHeader';
import useDartStore from '../../store/dart';
import { useNavigate } from 'react-router-dom';
import ProfilePicture from '../ProfilePicture';
import { getPeerNameColor } from '@dartfrog/puddle/index';

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

    const sortedEntries = React.useMemo(() => {
        return Array.from(messageStoreMap.entries()).sort((a, b) => {
            const aNode = a[0];
            const bNode = b[0];
            const aPeer = peerMap.get(aNode);
            const bPeer = peerMap.get(bNode);
            
            if (!aPeer && !bPeer) {
                return 0;
            }
            if (!aPeer) {
                return 1; // a is null, move it down
            }
            if (!bPeer) {
                return -1; // b is null, move it down
            }
            
            // Both peers exist, now check peerData
            if (!aPeer.peerData && !bPeer.peerData) {
                return 0;
            }
            if (!aPeer.peerData) {
                return 1; // a.peerData is null, move it down
            }
            if (!bPeer.peerData) {
                return -1; // b.peerData is null, move it down
            }
            
            // Both peers and peerData exist, add additional sorting logic here if needed
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
                                    <span style={{ color: "gray" }}>timestamp</span>
                                </div>
                                <div style={{ color: "gray" }}>
                                    message preview
                                </div>
                            </div>
                        </div>
                    ))}

            </div>
        </div>
    );
};

export default Messages;