import { create } from 'zustand'
import { ServiceApi } from '@dartfrog/puddle';

export const PLUGIN_NAME = "rumors:dartfrog:herobrine.os";

export interface Rumor {
  text: string;
  time: number;
  source: string | null;
}

export interface RumorsStore {
  rumors: Rumor[]
  createRumor: (api: ServiceApi, text: string) => void
  handleUpdate: (update: any) => void
  get: () => RumorsStore 
  set: (partial: RumorsStore | Partial<RumorsStore>) => void
}

const useRumorsStore = create<RumorsStore>((set, get) => ({
  rumors: [],
  
  createRumor: (api, text) => {
    const req = {
      "Rumors": {
        "CreateNewRumor": text
      }
    };
    api.sendToService(req);
  },

  handleUpdate: (update: any) => {
    console.log("update", update)
    if ('Rumors' in update) {
      set({ rumors: update.Rumors });
    } else if ('NewRumor' in update) {
      set((state) => ({ rumors: [update.NewRumor, ...state.rumors] }));
    } else {
      console.warn('Unknown update type:', update);
    }
  },
  
  get,
  set,
}))

export default useRumorsStore;
