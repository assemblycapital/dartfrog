import React, { useState, useEffect, useCallback } from 'react';
import useDartStore from '../../store/dart';
import { Peer, getClassForNameColor, NameColor, Profile, getRecencyText, DEFAULT_PFP, ActivitySetting } from '@dartfrog/puddle';
import { useNavigate } from 'react-router-dom';

import { useParams } from 'react-router-dom';

import './NodeProfile.css';
import ServiceList from '../Services/ServiceList';
import CurrentPageHeader from '../CurrentPageHeader';
import { renderLoading } from '../Middle';


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

    const { peerMap, delPeerMap, localFwdPeerRequest, requestSetProfile, localDeletePeer, setCurrentPage, requestSetActivitySetting } = useDartStore();

    const [peer, setPeer] = useState<Peer|null>(null);
    const [profileImage, setProfileImage] = useState<string>(DEFAULT_PFP);
    const [selectedProfileImage, setSelectedProfileImage] = useState<string | null>(null);
    const [nameColorClass, setNameColorClass] = useState<string>('name-color-default');
    const [isBadConnection, setIsBadConnection] = useState(false);
    const [isOurProfile, setIsOurProfile] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedBio, setSelectedBio] = useState<string>('');
    const [selectedNameColor, setSelectedNameColor] = useState<NameColor>(NameColor.Default);
    const [isLoadingImage, setIsLoadingImage] = useState(false);
    const [activitySetting, setActivitySetting] = useState<ActivitySetting>(ActivitySetting.Public);

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

    const handleActivitySettingChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setActivitySetting(event.target.value as ActivitySetting);
    };

    const handleSave = useCallback(() => {
        setIsEditMode(false);
        const newProfile = new Profile(selectedBio, selectedNameColor, selectedProfileImage)
        requestSetProfile(newProfile);
        requestSetActivitySetting(activitySetting);
        localFwdPeerRequest(node);
    }, [selectedBio, selectedNameColor, selectedProfileImage, activitySetting]);


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

    useEffect(() => {
        if (peer && peer.peerData) {
          const gotClass = getClassForNameColor(peer.peerData.profile.nameColor);
          if (peer.peerData.profile.pfp) {
            setProfileImage(peer.peerData.profile.pfp);
            setSelectedProfileImage(peer.peerData.profile.pfp);
          }
          setNameColorClass(gotClass);
          setSelectedNameColor(peer.peerData.profile.nameColor); // Set the initial selected color
          setSelectedBio(peer.peerData.profile.bio); // Set the initial bio
          setActivitySetting(peer.peerData.activity.type === 'Private' ? ActivitySetting.Private : ActivitySetting.Public);

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


    useEffect(()=>{
      setCurrentPage('nodes')
    }, [])
    return (
        <div
          style={{
            display:"flex",
            flexDirection:"column",
            gap:"0.6rem",
            marginTop:"0.6rem",
            // height:"100%"
          }}
        >
            {!peer ? (
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
                        all nodes
                      </div>
                    </button>
                    {renderConnectionStatus(peer, isBadConnection)}
                    {isBadConnection &&
                      <button
                        onClick={()=>{
                          localDeletePeer(node);
                          navigate("/nodes");
                          delPeerMap(node);
                        }}
                      >
                        delete
                      </button>
                    }
                  </div>
                 
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      height:"40vh",
                      minHeight: "40vh",
                    }}
                  >
                    <div
                      className="node-profile-image"
                      style={{
                        position: "absolute",
                        marginLeft:"1rem",
                        top: "50%",
                        left: "0",
                        transform: "translate(0, -50%)",
                        height: "20vh",
                        width: "20vh",
                        zIndex: 1,
                      }}
                      onClick={() => {
                        if (isOurProfile) {
                          setIsEditMode(true);
                        }
                      }}
                    >
                      <img 
                        src={profileImage} 
                        alt="profile image" 
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          opacity: isLoadingImage ? 0 : 1,
                        }}
                      />
                    </div>

                    <div
                      id="dark-profile-bg"
                      style={{
                        flex: "1",
                        // flexGrow:"0",
                        maxHeight:"20vh",
                        minHeight:"20vh",
                        backgroundColor: "#1f1f1f",
                      }}
                    />
                    <div
                      id="light-profile-bg"
                      style={{
                        flex: "1",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div
                       style={{
                        height:"10vh",
                        maxHeight:"10vh",
                        display:"flex",
                        flexDirection:"row",
                        alignItems: "center",
                      }}
                      >
                        {/* row that shares space with profile */}
                        <div
                          style={{
                            display:"inline-block",
                            height:"10vh",
                            width:"23vh",
                            minWidth:"23vh",
                          }}
                        >
                          {/* cover the bottom of the profile */}
                        </div>
                        {/* <div
                          style={{
                            flexGrow:"1"
                          }}
                        >
                        </div> */}
                        {!isOurProfile &&
                          <button
                            style={{
                              width:"auto",
                              height:"auto",
                              padding:"0.5rem 1rem",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            onClick={()=>{
                              navigate(`/messages/${peer.node}`)
                            }}
                          >
                            message
                          </button>
                        }
                        {isOurProfile &&
                          <button
                            onClick={()=>{
                              setIsEditMode(!isEditMode);
                            }}
                            style={{
                              width:"auto",
                              height:"auto",
                              padding:"0.5rem 1rem",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {isEditMode ? 'cancel profile edit' : 'edit profile'}
                          </button>
                        }
                      </div>
                      {isEditMode && (
                        <div style={{ marginTop: "1rem", marginBottom:"1rem", }}>
                          <input 
                            style={{
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
                        }}
                      >
                        <div
                          style={{
                            display:"inline-block",
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
                          <div
                            style={{
                              display:"inline-block",
                              marginLeft:"1rem",
                            }}
                          >
                            <select onChange={handleColorChange} value={selectedNameColor}>
                              {Object.values(NameColor).map((color) => (
                                  <option key={color} value={color}>{color.toLowerCase()}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          color:'gray',
                          cursor:'default',
                          display:"flex",
                          flexDirection:"row",
                        }}
                      >
                        <div>
                          {getActivityMessage(peer)}
                        </div>

                        {isEditMode &&
                              <div
                                style={{
                                  marginLeft:"1rem",
                                }}
                              >
                                <select
                                  name="activitySettingOption"
                                  id="activitySettingOption"
                                  value={activitySetting}
                                  onChange={handleActivitySettingChange}
                                  style={{
                                    width:"auto"
                                  }}
                                >
                                  <option value={ActivitySetting.Public}>share activity</option>
                                  <option value={ActivitySetting.Private}>make activity private</option>
                                </select>
                              </div>
                            }
                          </div>
                      {isEditMode ? (
                          <div style={{ marginTop: "1rem" }}>
                            <textarea
                              value={selectedBio}
                              onChange={handleBioChange}
                            />
                          </div>
                        ): (
                          <div
                            style={{
                              flex: '1',
                              fontSize: "1rem",
                              marginTop: "1rem",
                            }}
                          >
                            {peer.peerData ? peer.peerData.profile.bio : ''}
                          </div>
                        )}
                      {isEditMode &&
                        <div
                          style={{
                            marginTop: "1rem",
                            display:"flex",
                            gap:"1rem",
                            }}
                          >
                          <button
                            onClick={()=>{
                              setIsEditMode(!isEditMode);
                            }}
                          >
                            cancel
                          </button>
                          <button onClick={handleSave}>
                            save
                          </button>
                        </div>
                      }

                        
                    </div>
                    <div
                      style={{
                        margin:"1rem",
                        fontSize:"0.8rem",
                        marginTop: "2rem",
                      }}
                    >
                      {peer.peerData && peer.peerData.hostedServices.length > 0 &&

                        <ServiceList services={peer.peerData ? peer.peerData.hostedServices : []} />
                      }
                    </div>
                  </div>
              </div>
            )}
        </div>
    );
};
    export function getActivityMessage(peer) {
      if (peer && peer.peerData) {
        if (peer.peerData.activity.type === 'Private') {
          return 'ghost mode';
        }

        const activity = peer.peerData.activity;
        const activityTime = activity.timestamp*1000;
        const now = Date.now();

        if (now - activityTime <= 5 * 60 * 1000 && activity.type === 'Online') {
          return 'online now';
        }

        const delta = now - activityTime;

        return `active ${getRecencyText(delta)}`;
      }
      return ''
    }

export default NodeProfile;