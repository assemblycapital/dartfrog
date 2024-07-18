import React, { useState, useEffect } from 'react';
import useDartStore from '../../store/dart';
import { Peer, getClassForNameColor } from '@dartfrog/puddle/index';

import { useParams } from 'react-router-dom';
import defaultProfileImage from '../../assets/dartfrog256_nobg.png';

import './NodeProfile.css';


interface NodeProps {
}

const NodeProfile: React.FC<NodeProps> = ({ }) => {
    const { node } = useParams<{ node: string }>();
    const { peerMap, localFwdPeerRequest } = useDartStore();
    const [peer, setPeer] = useState<Peer|null>(null);
    const [profileImage, setProfileImage] = useState<string>(defaultProfileImage);
    const [nameColorClass, setNameColorClass] = useState<string>('name-color-default');
    const [isBadConnection, setIsBadConnection] = useState(false);

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
              <div>
                <div className='profile'>
                  <div className='profile-image'>
                    <img src={profileImage} alt="profileImage" />
                  </div>
                  <div
                    className={`profile-name ${nameColorClass}`}
                    style={{
                      flex: '1',
                      cursor: 'pointer',
                    }}
                  >
                    {peer.node}
                  </div>
                    {peer.outstandingRequest !== null &&
                      <>
                    {isBadConnection ? (
                      <div>
                        {`unresponsive`}
                      </div>
                    ):(
                      <div>
                        {`pinging...`}
                      </div>
                    )}
                      </>
                    }
                </div>
              </div>
            )}
        </div>
    );
};

export default NodeProfile;