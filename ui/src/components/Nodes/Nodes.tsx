import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PeerList from './PeerList'; // Import the new component
import './Nodes.css';

const Nodes: React.FC = () => {
  const [inputValue, setInputValue] = useState('');

  const navigate = useNavigate();

  const handleSubmit = useCallback(() => {
    if (inputValue === "") return;
    navigate(`/nodes/${inputValue}`)
  }, [inputValue]);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="current-page-header">
        nodes
      </div>

      <div style={{ marginTop: "1rem" }}>
        <input 
          type="text" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
        />
        <button onClick={handleSubmit}>find</button>
      </div>

      <PeerList />
    </div>
  );
};

export default Nodes;