import { create } from 'zustand'

import {ServiceApi} from '@dartfrog/puddle';
export const PLUGIN_NAME = "rumors:dartfrog:herobrine.os";


export interface RumorPost {
  uuid: string;
  text_contents: string;
  time: number;
  hops: number;
  heard_from: string | null;
  claims_relay: boolean;
}


export interface RumorsStore {
  rumors: RumorPost[]
  peers: string[]
  //
  createRumor: (api:ServiceApi, text: string) => void
  //
  handleUpdate: (update: any) => void;
  // 
  get: () => RumorsStore 
  set: (partial: RumorsStore | Partial<RumorsStore>) => void
}

const useRumorsStore = create<RumorsStore>((set, get) => ({
  rumors: [],
  peers: [],
  // 
  createRumor: (api, text) => {
    let req = 
      {
        "CreateNewRumor": 
          text
    }
    api.sendToProcess(req);
  },
  handleUpdate: (update: any) => {
    if ('Peers' in update) {
      set({ peers: update.Peers });
    } else if ('Rumors' in update) {
      set({ rumors: update.Rumors });
    } else if ('NewRumor' in update) {
      set((state) => ({ rumors: [...state.rumors, update.NewRumor] }));
    } else {
      console.warn('Unknown update type:', update);
    }
  },
  // 
  get,
  set,
}))

export default useRumorsStore;
