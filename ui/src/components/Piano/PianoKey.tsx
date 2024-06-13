// PianoKey.tsx
import React from 'react';
import './Piano.css';

interface PianoKeyProps {
  note: string;
  keyLetter: string;
  isSharp: boolean;
  playSound: () => void;
  isPressed: boolean;
}

const PianoKey: React.FC<PianoKeyProps> = ({ note, keyLetter, isSharp, playSound, isPressed }) => {
  return (
    <div
      className={`piano-key ${isSharp ? 'sharp' : 'natural'} ${isPressed ? 'pressed' : ''}`}
      onClick={playSound}
    >
      {keyLetter}
    </div>
  );
};

export default PianoKey;
