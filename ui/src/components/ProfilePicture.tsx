import React, { useEffect, useState } from 'react';
import useDartStore from '../store/dart';
import { DEFAULT_PFP, Peer } from '@dartfrog/puddle';
import './ProfilePicture.css'

const ProfilePicture: React.FC<{ size: string; node: string }> = ({ size, node }) => {
    const { peerMap, localFwdPeerRequest } = useDartStore();
    const [pfpImageUrl, setPfpImageUrl] = useState<string>(DEFAULT_PFP);

    useEffect(()=>{

      const gotPeer = peerMap.get(node)
      if (gotPeer && gotPeer.peerData && gotPeer.peerData.profile.pfp) {
        setPfpImageUrl(gotPeer.peerData.profile.pfp)
      }

    }, [peerMap, node])

    return (
        <div
          className="pfp-profile-image"
          style={{
            width:size,
            maxWidth:size,
            height:size,
            maxHeight:size,
          }}
        >
          <img src={pfpImageUrl} />
        </div>
    );
};

export default ProfilePicture;