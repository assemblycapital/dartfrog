import { create } from 'zustand'
import {ServiceApi} from '@dartfrog/puddle';

export const PLUGIN_NAME = "piano:dartfrog:herobrine.os";

export interface PianoStore {
  pianoState: PianoState
  setPianoState: (pianoState: PianoState) => void
  sendPlayNote: (text: string, api: ServiceApi) => void
  // 
  get: () => PianoStore 
  set: (partial: PianoStore | Partial<PianoStore>) => void
}

export type PianoState = {
  notePlayed: {
    note: string;
    player: string;
    timestamp: number;
  } | null;
}


const usePianoStore = create<PianoStore>((set, get) => ({
  pianoState: null,
  setPianoState: (pianoState) => {set({pianoState})},
  sendPlayNote: (text, api) => {
    let req = 
      {
      "Piano": {
        "PlayNote": 
          text
      }
    }
    api.sendToService(req);
  },
  // 
  get,
  set,
}))

export default usePianoStore;
