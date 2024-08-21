
import * as React from 'react';
import { useEffect, useState } from 'react';
import useChatStore from '@dartfrog/puddle/store/service';
import { DEFAULT_PFP, Peer } from '@dartfrog/puddle/index';

const ProfilePicture: React.FC<{ size: string; node: string }> = ({ size, node }) => {
    const { peerMap } = useChatStore();
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