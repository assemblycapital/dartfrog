import React, { useEffect, useState } from 'react';
import useDartStore from '../store/dart';

const RumorsBox: React.FC = () => {
  const { rumors, requestCreateNewRumor, setCurrentPage } = useDartStore();
  const [inputValue, setInputValue] = useState('');


  useEffect(()=>{
    setCurrentPage('rumors')
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      requestCreateNewRumor(inputValue);
      setInputValue('');
    }
  };

  return (
    <div
      style={{
        flex: "1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1rem",
        // backgroundColor:"#df7bdf",
        gap: "0.5rem",
        overflowY: "hidden",
      }}
    >
      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
        <input
          type="text"
          placeholder="rumor has it that..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{
            flexGrow: "1",
            width: "100%",
            margin: "0px",
          }}
        />
      </form>
      <div
        style={{
          overflowY: "auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {rumors.map((text, index) => (
          <div
            key={index}
            style={{
              width: "100%",
              textAlign: "center",
            }}
          >
            {text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RumorsBox;