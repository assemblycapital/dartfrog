import React, { useEffect, useState } from 'react';
import useRumorsStore from '../store/rumors';
import useServiceStore from '@dartfrog/puddle/store/service';

const RumorsBox: React.FC = () => {
  const { rumors, createRumor } = useRumorsStore();
  const { api } = useServiceStore();
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && api) {
      createRumor(api, inputValue.trim());
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
        gap: "0.5rem",
        overflowY: "hidden",
        height:"100vh",
        maxHeight:"100vh",
        boxSizing:"border-box"
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", width: "100%"}}>
        <input
          type="text"
          placeholder="rumor has it that..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{
            flexGrow: 1,
            minWidth: 0,
            margin: "0px",
          }}
        />
        <button>
          send
        </button>
      </form>
      <div
        style={{
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          width:"100%",
        }}
      >
        {rumors && rumors.length > 0 ? (
          rumors.map((rumor, index) => (
            <div
              key={index}
              style={{
                width: "auto",
                textAlign: "center",
                padding: "0.2rem",
              }}
            >
              <div>{rumor.text}</div>
              <div style={{ display:"none" }}>
                {new Date(rumor.time*1000).toLocaleString()}
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", }}>
            No rumors yet. Be the first to start one!
          </div>
        )}
      </div>
    </div>
  );
};

export default RumorsBox;
