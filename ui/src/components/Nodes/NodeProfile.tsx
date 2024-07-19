import React, { useState, useEffect, useCallback } from 'react';
import useDartStore from '../../store/dart';
import { Peer, getClassForNameColor, NameColor, Profile } from '@dartfrog/puddle/index';
import { useNavigate } from 'react-router-dom';

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
        cursor:"default",
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
    const { peerMap, localFwdPeerRequest, requestSetProfile } = useDartStore();
    const [peer, setPeer] = useState<Peer|null>(null);
    const [profileImage, setProfileImage] = useState<string>(defaultProfileImage);
    const [selectedProfileImage, setSelectedProfileImage] = useState<string | null>(null);
    const [nameColorClass, setNameColorClass] = useState<string>('name-color-default');
    const [isBadConnection, setIsBadConnection] = useState(false);
    const [isOurProfile, setIsOurProfile] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedBio, setSelectedBio] = useState<string>('');
    const [selectedNameColor, setSelectedNameColor] = useState<NameColor>(NameColor.Default);
    const [isLoadingImage, setIsLoadingImage] = useState(false);

    const navigate = useNavigate();

    useEffect(()=>{
      const nodeOur = node===window.our?.node
      setIsOurProfile(nodeOur);
    }, [node])

    const checkImageURL = async (url: string) => {
        try {
            const response = await fetch(url);
            return (response.ok)
        } catch (error) {
            return false
        }
    };

    const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const imageUrl = event.target.value;
        const valid  = checkImageURL(imageUrl)
        if (valid) {
          setSelectedProfileImage(imageUrl);
          setProfileImage(imageUrl);
        }
    };

    const handleColorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedColor = event.target.value as NameColor;
        setSelectedNameColor(selectedColor);
        const gotClass = getClassForNameColor(selectedColor);
        setNameColorClass(gotClass);
    };

    const handleBioChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSelectedBio(event.target.value);
    };

    const handleSave = useCallback(() => {
        setIsEditMode(false);
        const newProfile = new Profile(selectedBio, selectedNameColor, selectedProfileImage)
        requestSetProfile(newProfile);
        localFwdPeerRequest(node);
    }, [selectedBio, selectedNameColor, selectedProfileImage]);


    useEffect(() => {
      localFwdPeerRequest(node);
    }, [node]);

    useEffect(() => {
        if (peerMap && node) {
            const gotPeer = peerMap.get(node);
            if (gotPeer) {
              setPeer(gotPeer);
            }
        }
    }, [peerMap, node]);

    const updateProfileImage = async () => {
        if (peer && peer.peerData && peer.peerData.profile.pfp) {
            setIsLoadingImage(true); // Set loading to true before the fetch
            const valid = await checkImageURL(peer.peerData.profile.pfp);
            if (valid) {
                setProfileImage(peer.peerData.profile.pfp);
                setSelectedProfileImage(peer.peerData.profile.pfp);
            }
            setTimeout(() => {
              setIsLoadingImage(false);
          }, 500);
        }
    };

    useEffect(() => {
        updateProfileImage();
        if (peer && peer.peerData) {
          const gotClass = getClassForNameColor(peer.peerData.profile.nameColor);
          setNameColorClass(gotClass);
          setSelectedNameColor(peer.peerData.profile.nameColor); // Set the initial selected color
          setSelectedBio(peer.peerData.profile.bio); // Set the initial bio
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
            gap:"0.6rem",
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
                    <button
                      onClick={()=>{
                        navigate("/nodes")
                      
                      }}
                      style={{
                        cursor:"pointer",
                        fontSize: "0.8rem",
                        width:"auto",
                      }}
                    >
                      <div>
                        back to all nodes

                      </div>
                    </button>
                    {isOurProfile && 
                      <button
                        onClick={()=>{
                          setIsEditMode(!isEditMode);
                        }}
                      >
                        {isEditMode ? 'cancel' : 'edit'}
                      </button>
                    }
                    {renderConnectionStatus(peer, isBadConnection)}
                  </div>
                 
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
                      }}
                    >
                      <img 
                        src={profileImage} 
                        alt="profile image" 
                        style={{
                          opacity: isLoadingImage ? 0 : 1, // Set opacity based on loading state
                        }}
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
                      }}
                    >
                      {peer.node}
                    </div>
                      {isEditMode && (
                        <div>
                          <select onChange={handleColorChange} value={selectedNameColor}>
                            {Object.values(NameColor).map((color) => (
                                <option key={color} value={color}>{color.toLowerCase()}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    {isEditMode ? (
                        <div>
                          <textarea
                            value={selectedBio}
                            onChange={handleBioChange}
                          />
                        </div>
                      ): (
                        <div
                          style={{
                            flex: '1',
                            fontSize:"1rem",
                          }}
                        >
                          {peer.peerData ? peer.peerData.profile.bio : ''}
                        </div>
                      )}
                    {isEditMode && (
                      <div>
                        <button
                          onClick={handleSave}
                        >
                          save
                        </button>
                      </div>
                    )}
              </div>
            )}
        </div>
    );
};

export default NodeProfile;