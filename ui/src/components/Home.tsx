import React, { useEffect } from 'react';
import useDartStore from '../store/dart';

const Home: React.FC = () => {
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
        home
      </div>
      <div
        style={{
          flexGrow:"1",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        TODO home page
      </div>
    </div>
  );
};

export default Home;