import { create } from 'zustand'

import {ServiceApi} from '@dartfrog/puddle';
export const PLUGIN_NAME = "rumors:dartfrog:herobrine.os";




export interface RumorsStore {
  sendRumor: (api:ServiceApi, text: string) => void
  // 
  get: () => RumorsStore 
  set: (partial: RumorsStore | Partial<RumorsStore>) => void
}

const useRumorsStore = create<RumorsStore>((set, get) => ({
  // 
  sendRumor: (api, text) => {
    let req = 
      {
      "Page": {
        "EditPage": 
          text
      }
    }
    api.sendToService(req);
  },
  // 
  get,
  set,
}))

export default useRumorsStore;
