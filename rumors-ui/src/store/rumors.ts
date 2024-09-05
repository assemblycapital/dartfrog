import { create } from 'zustand'

import {ServiceApi} from '@dartfrog/puddle';
export const PLUGIN_NAME = "rumors:dartfrog:herobrine.os";




export interface RumorsStore {
  createRumor: (api:ServiceApi, text: string) => void
  // 
  get: () => RumorsStore 
  set: (partial: RumorsStore | Partial<RumorsStore>) => void
}

const useRumorsStore = create<RumorsStore>((set, get) => ({
  // 
  createRumor: (api, text) => {
    let req = 
      {
        "CreateRumor": 
          text
    }
    api.sendToProcess(req);
  },
  // 
  get,
  set,
}))

export default useRumorsStore;
