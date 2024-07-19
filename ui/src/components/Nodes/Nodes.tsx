import React, { useEffect, useState, useCallback } from 'react';
import useDartStore from '../../store/dart';
import { useNavigate } from 'react-router-dom';
import { getPeerNameColor, getPeerPfp } from '@dartfrog/puddle/index';
import ProfilePicture from '../ProfilePicture';
import './Nodes.css';

const Nodes: React.FC = () => {
  const { peerMap, localFwdPeerRequest } = useDartStore();
  const [inputValue, setInputValue] = useState('');

  const navigate = useNavigate();


  const handleSubmit = useCallback(() => {
    if (inputValue === "") return;
    navigate(`/nodes/${inputValue}`)
  }, [inputValue]);

  return (
    <div
      style={{
        height:"100%",
        display:"flex",
        flexDirection:"column",
      }}
    >
      <div
        className="current-page-header"
      >
        nodes
      </div>

      <div
        style={{
          marginTop:"1rem",
        }}
      >
        <input 
          type="text" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
        />
        <button onClick={handleSubmit}>find</button>

      </div>
      <div
        style={{
          marginTop:"1rem",
        }}
      >
        {Array.from(peerMap.entries()).map(([node, peer]) => (
          <div key={node}
            className="nodes-node-row"
              onClick={ ()=>{
                navigate(`/nodes/${node}`)
              }}
          >
            <div
              style={{
                cursor:"pointer",
                display:"inline-block",
              }}
            >

              <div
                style={{
                display:"flex",
                flexDirection:"row",
                gap :"1rem",
                alignItems: "center"
                }}
              >

                <ProfilePicture size={"64px"} node={node} />
                <span
                  className={getPeerNameColor(peer)}
                >
                {node}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Nodes;