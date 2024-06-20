// PianoKey.tsx
import React from 'react';
import './Piano.css';

interface PianoKeyProps {
  note: string;
  keyLetter: string;
  isSharp: boolean;
  playSound: () => void;
  pressedColor: string | null;
}

const colorClasses = {
  '#cc4444': 'pressed-red',
  '#339933': 'pressed-green',
  '#4682B4': 'pressed-blue',
  '#cc7a00': 'pressed-orange',
  '#a36bdb': 'pressed-purple'
}

const PianoKey: React.FC<PianoKeyProps> = ({ note, keyLetter, isSharp, playSound, pressedColor}) => {
  if (!pressedColor) {
    return (
      <div
        className={`piano-key ${isSharp ? 'sharp' : 'natural'}`}
        onClick={playSound}
      >
        {keyLetter}
      </div>
    );
  }
  let colorClass = colorClasses[pressedColor];
  return (
    <div
      className={`piano-key ${isSharp ? 'sharp' : 'natural'} ${colorClass}`}
      onClick={playSound}
    >
      {keyLetter}
    </div>
  )


};

export default PianoKey;
