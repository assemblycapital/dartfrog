import React, { useEffect, useState, useCallback } from 'react';
import useDartStore from '../../store/dart';
import { useNavigate } from 'react-router-dom';

const Nodes: React.FC = () => {
  const { peerMap, localFwdPeerRequest } = useDartStore();
  const [inputValue, setInputValue] = useState('');

  const navigate = useNavigate();


  const handleSubmit = useCallback(() => {
    if (inputValue === "") return;
    localFwdPeerRequest(inputValue);
    setInputValue("");
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
        <button onClick={handleSubmit}>Submit</button>

      </div>
      <div
        style={{
          marginTop:"1rem",
        }}
      >
        {Array.from(peerMap.entries()).map(([node, peer]) => (
          <div key={node}
          >
            <div
              style={{
                cursor:"pointer",
                display:"inline-block",
              }}
              onClick={ ()=>{
                navigate(`/nodes/${node}`)
              }}
            >

            <span>{node}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Nodes;