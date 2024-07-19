import React, { useState, useEffect } from 'react';
import useDartStore from '../../store/dart';
import { Peer, getClassForNameColor, NameColor } from '@dartfrog/puddle/index';

import { useParams } from 'react-router-dom';
import defaultProfileImage from '../../assets/dartfrog256_nobg.png';

import './NodeProfile.css';


interface NodeProps {
}

const renderConnectionStatus = (peer: Peer | null, isBadConnection: boolean) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "1rem",
        color: "gray",
        fontSize: "0.8rem",
      }}
    >
      <div>connection:</div>
      {peer?.outstandingRequest === null ? (
        <div>live</div>
      ) : (
        <>
          {isBadConnection ? (
            <div className="name-color-red">unresponsive</div>
          ) : (
            <div>pinging...</div>
          )}
        </>
      )}
    </div>
  );
};

const NodeProfile: React.FC<NodeProps> = ({ }) => {
    const { node } = useParams<{ node: string }>();
    const { peerMap, localFwdPeerRequest } = useDartStore();
    const [peer, setPeer] = useState<Peer|null>(null);
    const [profileImage, setProfileImage] = useState<string>(defaultProfileImage);
    const [nameColorClass, setNameColorClass] = useState<string>('name-color-default');
    const [isBadConnection, setIsBadConnection] = useState(false);
    const [isOurProfile, setIsOurProfile] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(()=>{
      const nodeOur = node===window.our?.node
      setIsOurProfile(nodeOur);
    }, [node])

    const checkImageURL = async (url: string) => {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return url;
            } else {
                return defaultProfileImage;
            }
        } catch (error) {
            return defaultProfileImage;
        }
    };

    const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const imageUrl = event.target.value;
        const validImageUrl = await checkImageURL(imageUrl);
        setProfileImage(validImageUrl);
        // Here you might want to upload the image to your server
    };

    const handleColorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedColor = event.target.value as NameColor;
        const gotClass = getClassForNameColor(selectedColor);
        setNameColorClass(gotClass);
        // Here you might want to update the color on your server
    };

    useEffect(() => {
        if (peerMap && node) {
            const gotPeer = peerMap.get(node);
            if (!(gotPeer)) {
              localFwdPeerRequest(node);
            } else {
              setPeer(gotPeer);
            }
        }
    }, [peerMap, node]);

    useEffect(() => {
        const updateProfileImage = async () => {
            if (peer && peer.peerData && peer.peerData.profile.pfp) {
                const validImageUrl = await checkImageURL(peer.peerData.profile.pfp);
                setProfileImage(validImageUrl);
            }
        };
        setProfileImage(defaultProfileImage); 
        updateProfileImage();
        if (peer && peer.peerData) {
          const gotClass = getClassForNameColor(peer.peerData.profile.nameColor);
          // console.log("gotnameclass", gotClass)
          setNameColorClass(gotClass);
        }
    }, [peer]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (peer && peer.outstandingRequest !== null) {
            timer = setTimeout(() => {
                if (Date.now() - peer.outstandingRequest * 1000 >= 5000) {
                    setIsBadConnection(true);
                }
            }, 5000);
        }
        else if (peer && peer.outstandingRequest === null) {
          // this implies the request is fulfilled, but it relies on actually sending a request lol
          setIsBadConnection(false);
        }
        return () => clearTimeout(timer);
    }, [peer]);

    return (
        <div
          style={{
            display:"flex",
            flexDirection:"column",
            // height:"100%"
          }}
        >
            <div
              className="current-page-header"
            >
              profile: {node}
            </div>
            {!peer ? (
              <div>
                loading...
              </div>

            ): (
              <div
                style={{
                  display:"flex",
                  flexDirection:"column",
                  textAlign:"center",

                }}
              >
                  {renderConnectionStatus(peer, isBadConnection)}
                  {isOurProfile && 
                    <button
                      onClick={()=>{
                        setIsEditMode(!isEditMode);
                      }}
                    >
                      {isEditMode ? 'cancel' : 'edit'}
                    </button>
                  }
                  <div>
                    <div
                      className="node-profile-image"
                      style={{
                        height:"30vh",
                        width:"30vh",

                      }}
                      onClick={()=>{
                        if (isOurProfile) {
                          setIsEditMode(true);
                        }
                      }
                      }
                    >
                      <img 
                        src={profileImage} 
                        alt="profile image" 
                      />
                    </div>

                  </div>
                      {isEditMode && (
                        <div>

                        <input 
                          style={{
                            margin:'0'
                          }}
                          type="text" 
                          placeholder="Enter image URL" 
                          onChange={handleProfileImageChange} 
                        />
                        </div>
                      )}

                    <div
                      className={`${nameColorClass}`}
                      style={{
                        flex: '1',
                        fontSize:"1.5rem",
                        cursor: isOurProfile ? 'pointer' : 'default',
                      }}
                      onClick={()=>{
                        if (isOurProfile) {
                          setIsEditMode(true);
                        }
                      }
                      }
                    >
                      {peer.node}
                    </div>
                      {isEditMode && (
                        <div>
                          <select onChange={handleColorChange}>
                            {Object.values(NameColor).map((color) => (
                                <option key={color} value={color}>{color.toLowerCase()}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    <div
                      style={{
                        flex: '1',
                        fontSize:"1rem",
                      }}
                    >
                      {peer.peerData && peer.peerData.profile.bio}
                    </div>
              </div>
            )}
        </div>
    );
};

export default NodeProfile;