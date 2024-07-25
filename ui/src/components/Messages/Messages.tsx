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


    return (
        <div>
            <div style={{ marginTop: "1rem"}}>
                <input 
                type="text" 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                />
                <button onClick={handleSubmit}>new</button>
            </div>

            <div
              style={{
                display:"flex",
                flexDirection:"column",
                width:"100%",
              }}
            >
                {Array.from(messageStoreMap.entries()).map(([node, value]) => (
                        <div key={node}
                          style={{
                            display:"flex",
                            flexDirection:"row",
                            width:"100%",
                            cursor:"pointer",
                            gap:"1rem",
                            padding:"8px",
                          }}
                          className="hover-dark-gray"
                          onClick={()=>{
                            navigate(`/messages/${node}`)

                          }}

                        >
                            <ProfilePicture size="48px" node={node} />
                            <div
                            >
                                <div
                                  className={getPeerNameColor(peerMap.get(node))}
                                  style={{
                                    display:"flex",
                                    flexDirection:"row",
                                    gap:"1rem",
                                  }}
                                >
                                    <span>
                                      {node}
                                    </span>
                                    <span
                                      style={{color:"gray",}}
                                    >
                                      timestamp
                                    </span>
                                </div>
                                <div
                                  style={{color:"gray",}}
                                >
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
