import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PeerList from './PeerList';
import './Nodes.css';
import CurrentPageHeader from '../CurrentPageHeader';
import useDartStore from '../../store/dart';

const Nodes: React.FC = () => {
  const [inputValue, setInputValue] = useState('');

  const navigate = useNavigate();

  const {setCurrentPage} = useDartStore();

  const handleSubmit = useCallback(() => {
    if (inputValue === "") return;
    navigate(`/nodes/${inputValue}`)
  }, [inputValue]);


  useEffect(()=>{
    setCurrentPage('nodes')
  }, [])

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >

      <div style={{
          marginTop: "1rem",
          width:"100%",
          display: "flex",
          flexDirection: "row",
        }}
      >
        <input 
          type="text" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          placeholder='node-to-search.os'
          style={{
            flexGrow:"1",
          }}
        />
        <button onClick={handleSubmit}>find</button>
      </div>

      <div
        style={{
          margin:"1rem",
          height:"100%",
          maxHeight:"100%",
          overflowY:"hidden",
        }}
      >
        <PeerList />
      </div>
    </div>
  );
};

export default Nodes;