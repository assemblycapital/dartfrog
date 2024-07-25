import React, { useCallback, useEffect, useState } from 'react';
import CurrentPageHeader from '../CurrentPageHeader';
import useDartStore, { MessageStore } from '../../store/dart';
import { useNavigate, useParams } from 'react-router-dom';
import { renderLoading } from '../Middle';
import ProfilePicture from '../ProfilePicture';
import { getClassForNameColor, getPeerNameColor } from '@dartfrog/puddle/index';

const MessagesNode: React.FC = () => {
    const {setCurrentPage, messageStoreMap, requestNewMessageStore, peerMap} = useDartStore();

    const { node } = useParams<{ node: string }>();

    const [inputValue, setInputValue] = useState('');
    const [messageStore, setMessageStore] = useState<MessageStore>(null);

    const navigate = useNavigate();

    useEffect(()=>{
        setCurrentPage('messages')
    }, [])


    useEffect(()=>{
        
        let gotMessageStore = messageStoreMap.get(node);
        if (!gotMessageStore) {


            requestNewMessageStore(node)
            return;

        }
        console.log("got message store!", gotMessageStore)
        setMessageStore(gotMessageStore);
    }, [messageStoreMap])

    return (
        <div
          style={{
            display:"flex",
            flexDirection:"column",
            gap:"0.6rem",
            marginTop:"0.6rem",
            height:"100%",
          }}
        >
            {!messageStore? (
              renderLoading()
            ): (
              <div
                style={{
                  display:"flex",
                  flexDirection:"column",
                  // textAlign:"center",
                  gap:"0.6rem",

                }}
              >
                  <div
                    style={{ 
                      display:"flex",
                      flexDirection:"row",
                      alignItems: "center",
                      gap:"1rem",
                     }}
                  >
                    <div
                    >
                        <button
                            onClick={()=>{
                                navigate("/messages")
                            
                            }}
                            style={{
                                cursor:"pointer",
                                fontSize: "1.6rem",
                                width:"auto",
                                color:"gray",
                                height:"auto",
                            }}
                        >
                            <span>◄</span>

                        </button>
                    </div>
                    <div
                    >
                        <ProfilePicture size="48px" node={node} />
                    </div>
                    <div
                        style={{
                            cursor:"default",
                            fontSize:"1.3rem",
                        }}
                        className={getPeerNameColor(peerMap.get(node))}
                    >
                        {node}

                    </div>
                </div>
                <div
                  style={{
                    flexGrow:"1",
                  }}
                >
                
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    height:"100%",
                    maxHeight:"100%",
                  }}
                >
                  <textarea
                    style={{
                      flexGrow: 1,
                      fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
                      marginRight: '0px',
                    }}
                    // value={chatMessageInputText}
                    // onChange={handleInputChange}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        // sendChatCallback(event);
                      }
                    }}
                  />
                  <div>
                  <button style={{ cursor: 'pointer', height: '100%' }}
                  // onClick={sendChatCallback}
                  >
                    Send
                  </button>
                  </div>
                </div>

            </div>
            )}
        </div>

    );
};

export default MessagesNode;
