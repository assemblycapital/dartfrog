import React, { useState, useEffect } from 'react';

// Define the enum for the animation states
enum DotState {
  ThreeDots,
  TwoShrinking,
  OneDot,
  TwoGrowing
}

// Define a dictionary to map states to display text
const dotDisplay: Record<DotState, string> = {
  [DotState.ThreeDots]: '...',
  [DotState.TwoShrinking]: '..',
  [DotState.OneDot]: '.',
  [DotState.TwoGrowing]: '..'
};

const ConnectingAnimation: React.FC = () => {
  const [dotState, setDotState] = useState<DotState>(DotState.ThreeDots);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotState(prevState => (prevState + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return <div>Connecting{dotDisplay[dotState]}</div>;
};

export default ConnectingAnimation;