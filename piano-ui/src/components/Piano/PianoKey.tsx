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
  'name-color-red': 'pressed-red',
  'name-color-green': 'pressed-green',
  'name-color-blue': 'pressed-blue',
  'name-color-orange': 'pressed-orange',
  'name-color-purple': 'pressed-purple',
  'name-color-default': 'pressed-orange',
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
