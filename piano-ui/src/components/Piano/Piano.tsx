// Piano.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import PianoKey from './PianoKey';
import './Piano.css';
import usePianoStore from '../../store/piano';
import useChatStore from '@dartfrog/puddle/store/chat';
import { PROCESS_NAME } from '../../utils';
import { getPeerNameColor } from '@dartfrog/puddle';

const PIANO_NOTES_FOLDER = `/${PROCESS_NAME}/assets/piano_notes`;

const notes = [
  { note: 'A4', isSharp: false, fileName: 'a4.mp3', key: 'a' },
  { note: 'A#4', isSharp: true, fileName: 'a-4.mp3', key: 'w' },
  { note: 'B4', isSharp: false, fileName: 'b4.mp3', key: 's' },
  { note: 'C4', isSharp: false, fileName: 'c4.mp3', key: 'd' },
  { note: 'C#4', isSharp: true, fileName: 'c-4.mp3', key: 'r' },
  { note: 'D4', isSharp: false, fileName: 'd4.mp3', key: 'f' },
  { note: 'D#4', isSharp: true, fileName: 'd-4.mp3', key: 't' },
  { note: 'E4', isSharp: false, fileName: 'e4.mp3', key: 'g' },
  { note: 'F4', isSharp: false, fileName: 'f4.mp3', key: 'h' },
  { note: 'F#4', isSharp: true, fileName: 'f-4.mp3', key: 'u' },
  { note: 'G4', isSharp: false, fileName: 'g4.mp3', key: 'j' },
  { note: 'G#4', isSharp: true, fileName: 'g-4.mp3', key: 'i' },
  { note: 'A5', isSharp: false, fileName: 'a5.mp3', key: 'k' },
  { note: 'A#5', isSharp: true, fileName: 'a-5.mp3', key: 'o' },
  { note: 'B5', isSharp: false, fileName: 'b5.mp3', key: 'l' },
  { note: 'C5', isSharp: false, fileName: 'c5.mp3', key: ';' },
  { note: 'C#5', isSharp: true, fileName: 'c-5.mp3', key: '[' },
  { note: 'D5', isSharp: false, fileName: 'd5.mp3', key: "'" },
];

const Piano: React.FC = () => {
  const { api } = useChatStore();
  const { peerMap } = useChatStore();
  const {sendPlayNote, pianoState } = usePianoStore();
  const [sounds, setSounds] = useState<{ [key: string]: Howl }>({});
  const [pressedKeys, setPressedKeys] = useState<{ [key: string]: string | null}>({});
  const [userPressedKeys, setUserPressedKeys] = useState<{ [key: string]: boolean}>({});
  const pianoRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (pianoState == null) return;
    if( pianoState.notePlayed === null) return;
    let now = Date.now();
    let elapsed = now - pianoState.notePlayed.timestamp;
    if (elapsed > 1000) return;
    if (pianoState.notePlayed.note === null) return;
    let sound = sounds[pianoState.notePlayed.note];
    if (!sound) {
      return
    }

    let from = pianoState.notePlayed.player;
    let color = getPeerNameColor(peerMap.get(from))
    sound.play();
    setPressedKeys(prev => ({ ...prev, [pianoState.notePlayed.note]: color}));
    setTimeout(() => {
      setPressedKeys(prev => ({ ...prev, [pianoState.notePlayed.note]: null}));
    }, 200);
  }, [pianoState, sounds])

  useEffect(() => {
    const loadedSounds: { [key: string]: Howl } = {};
    notes.forEach(note => {
      loadedSounds[note.note] = new Howl({
        src: [`${PIANO_NOTES_FOLDER}/${note.fileName}`],
      });
    });
    setSounds(loadedSounds);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isFocused) {
        const note = notes.find(n => n.key === event.key);
        if (note && sounds[note.note] && !userPressedKeys[note.note]) {
          handlePlayNote(note.note);
          setUserPressedKeys(prev => ({ ...prev, [note.note]: true }));
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (isFocused) {
        const note = notes.find(n => n.key === event.key);
        if (note) {
          setUserPressedKeys(prev => ({ ...prev, [note.note]: false }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [sounds, userPressedKeys, isFocused]);

  const handlePlayNote = useCallback((note: string) => {
    sendPlayNote(note, api);
  }, [sendPlayNote, api]);

  return (
    <div
      className="piano"
      tabIndex={0}
      ref={pianoRef}
      style={{
        height: "100%",
        width: "100%",
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
      {notes.map((note) => (
        <PianoKey 
          key={note.note} 
          note={note.note} 
          keyLetter={note.key}
          isSharp={note.isSharp} 
          playSound={() => {
            handlePlayNote(note.note);
            }
          }
          pressedColor={pressedKeys[note.note]}
        />
      ))}
      </div>
    </div>
  );
};

export default Piano;