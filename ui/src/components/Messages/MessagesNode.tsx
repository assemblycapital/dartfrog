import React, { useCallback, useEffect, useRef, useState } from 'react';
import CurrentPageHeader from '../CurrentPageHeader';
import useDartStore, { MessageStore } from '../../store/dart';
import { useNavigate, useParams } from 'react-router-dom';
import { renderLoading } from '../Middle';
import ProfilePicture from '../ProfilePicture';
import { dfLinkRegex, dfLinkToRealLink, getClassForNameColor, getPeerNameColor, nodeProfileLink } from '@dartfrog/puddle/index';
import { maybeReplaceWithImage } from '@dartfrog/puddle/utils';
import { formatTimestamp, isImageUrl, linkRegex } from '@dartfrog/puddle/components/ChatBox';
import Split from 'react-split';
import { getActivityMessage } from '../Nodes/NodeProfile';
import { hasUnreadHistory } from './Messages';

const MessagesNode: React.FC = () => {
    const {setCurrentPage, messageStoreMap, requestNewMessageStore, clearUnreadMessageStore, peerMap, localFwdPeerRequest, requestSendMessage} = useDartStore();

    const { node } = useParams<{ node: string }>();

    const [inputValue, setInputValue] = useState('');
    const [messageStore, setMessageStore] = useState<MessageStore>(null);
    const [isPinging, setIsPinging] = useState(true);
    const [isBadConnection, setIsBadConnection] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const navigate = useNavigate();

    const baseOrigin = window.origin.split(".").slice(1).join(".")

    useEffect(()=>{
        setCurrentPage('messages')
    }, [])

    useEffect(()=>{
        
        let gotMessageStore = messageStoreMap.get(node);
        if (!gotMessageStore) {


            requestNewMessageStore(node)
            return;

        }
        setMessageStore(gotMessageStore);
    }, [messageStoreMap])


    const [chatMessageInputText, setChatMessageInputText] = useState('');
  
    const handleInputChange = (event) => {
      setChatMessageInputText(event.target.value);
    };
  
    const sendChatCallback = useCallback(
      async (event) => {
        event.preventDefault();
        if (!chatMessageInputText) return;
        let text = maybeReplaceWithImage(chatMessageInputText);
        requestSendMessage(node, text);
        setChatMessageInputText('');
      },
      [chatMessageInputText]
    );
   
    const [componentLoadTime, setComponentLoadTime] = useState(Date.now());

    const scrollDownChat = useCallback(() => {
      if (messagesEndRef.current) {
        const behavior = Date.now() - componentLoadTime < 2000 ? "auto" : "smooth";
        messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
      }
    }, [messagesEndRef, componentLoadTime]);

    useEffect(() => {
        scrollDownChat();
    }, [messageStore]);

    useEffect(() => {
        // Clear unread messages after a short delay
        if (messageStore && hasUnreadHistory(messageStore.history)) {
          clearUnreadMessageStore(node);
        }
    }, [node, messageStore, clearUnreadMessageStore]);

    useEffect(() => {
      let timer: NodeJS.Timeout;
      const peer = peerMap.get(node);
      if (peer && peer.outstandingRequest !== null) {
          timer = setTimeout(() => {
              setIsPinging(false)
              if (Date.now() - peer.outstandingRequest * 1000 >= 5000) {
                  setIsBadConnection(true);
              }
          }, 5000);
      }
      else if (peer && peer.outstandingRequest === null) {
        setIsBadConnection(false);
        setIsPinging(false);
      }
      return () => clearTimeout(timer);
    }, [peerMap]);


    useEffect(() => {
        setComponentLoadTime(Date.now());
        localFwdPeerRequest(node);
    }, []);

    const getMessageInnerText = useCallback(
      (message: string) => {
        if (isImageUrl(message)) {
          return (
            <img
              src={message}
              alt="chat image"
              style={{
                height: "100%",
                maxHeight: "9rem",
                objectFit: "cover",
                maxWidth: "100%",
              }}
              onLoad={()=>{
                scrollDownChat()
              }}
            />
          );
        } else if (linkRegex.test(message)) {
          return (
            <span>
              <a
                className="link"
                style={{
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
                href={message}
              >
                {message}
              </a>
            </span>
          );
        } else if (dfLinkRegex.test(message)) {
          const realLink = dfLinkToRealLink(message, baseOrigin)
          return (
            <span>
              <a
                style={{
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
                href={realLink}
                className="link"
              >
                {message}
              </a>
            </span>
          );
  
        } else {
          return <span>{message.replace(/\s+/g, ' ')}</span>;
        }
      },
      [scrollDownChat]
    );


    if (!messageStore) {

      return renderLoading();
    }

    return (
                <div
                  style={{
                    display: "flex",
                    flexDirection:"column",
                    flexGrow:"1",
                    maxHeight:"100%",
                    overflow:"hidden",
                  }}
                >
                    {/* Header */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "0.5rem",
                        gap:"1rem",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}>
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
                            display:"flex",
                            flexDirection:"column",
                            width:"100%",
                          }}
                        >

                          <div
                              style={{
                                  cursor:"default",
                                  fontSize:"1.3rem",
                              }}
                              className={getPeerNameColor(peerMap.get(node))}
                          >
                              {node}

                          </div>
                          <div
                            style={{
                                  cursor:"default",
                                  fontSize:"0.8rem",
                                  color:"gray",
                                  display:"flex",
                                  flexDirection:"row",
                                  gap:"1rem"
                            }}
                          >
                            <div>
                              {peerMap.get(node) && getActivityMessage(peerMap.get(node))}
                            </div>
                            <div>
                              {isPinging ? ('pinging...' ):(
                                <>
                                {isBadConnection && 'node unresponsive, messages may not deliver'}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                    </div>

                    <Split
                      sizes={[95, 5]}
                      minSize={45}
                      direction="vertical"
                      style={{
                        flexGrow:"1",
                        display: "flex",
                        flexDirection: "column",
                        overflow:"auto"
                      }}
                    >
                    {/* Message history */}
                    <div style={{
                        flexGrow: 1,
                        overflowY: "auto",
                        justifyContent: "flex-end",
                        alignContent: "flex-end",
                        alignItems: "flex-end",
                        justifyItems: "flex-end",
                    }}>
                        {messageStore.history.map((message, index) => (
                            <div key={index}
                                className='chat-message'
                                style={{
                                    display:"flex",
                                    flexDirection:"row",
                                    width:"100%",
                                    gap:"8px",
                                    padding: "6px 0rem",
                                }}
                            >
                                <div
                                    style={{
                                        userSelect:"none",
                                    }}
                                >
                                    <a
                                        href={nodeProfileLink(message.from, baseOrigin)}
                                    >
                                        <ProfilePicture size="40px" node={message.from} />
                                    </a>
                                </div>
                                <div
                                    style={{
                                        display:"flex",
                                        flexDirection:"column",
                                        width:"100%",
                                    }}
                                >
                                    <div style={{ verticalAlign: "top", userSelect: "none", }}>
                                        <a style={{ display: "inline-block", marginRight: "8px", cursor: "pointer" }}
                                            className={getPeerNameColor(peerMap.get(message.from))}
                                            href={nodeProfileLink(message.from, baseOrigin)}
                                            onClick={(e)=>{
                                                e.preventDefault();
                                                navigate(`/nodes/${message.from}`)
                                            }}
                                        >
                                            <span>{message.from}:</span>
                                        </a>
                                        <div style={{ color: "#ffffff77", fontSize: "0.7rem", display: "inline-block", marginRight: "5px", cursor: "default" }}>
                                            <span>{formatTimestamp(message.time_received)}</span>
                                        </div>
                                    </div>
                                    <span style={{ cursor: "default", wordWrap: "break-word", overflowWrap: "break-word", whiteSpace: "pre-wrap" }}>
                                        {getMessageInnerText(message.contents)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} style={{height:"1px"}} />
                    </div>

                    {/* Chat input */}
                    <div style={{
                        display: 'flex',
                        flexGrow:"1",

                    }}>
                        <textarea
                            style={{
                                flexGrow: 1,
                                marginRight: '8px',
                                resize: "none",
                                height: '100%',
                            }}
                            value={chatMessageInputText}
                            onChange={handleInputChange}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault();
                                    sendChatCallback(event);
                                }
                            }}
                        />
                        <button
                            style={{
                                cursor: 'pointer',
                                height: '100%',
                                minWidth: '60px',
                            }}
                            onClick={sendChatCallback}
                        >
                            Send
                        </button>
                    </div>


                    </Split>
                </div>
    );
};

export default MessagesNode;