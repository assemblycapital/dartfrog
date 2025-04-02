import { create } from 'zustand'
import { ServiceApi } from '@dartfrog/puddle';

export const PLUGIN_NAME = "rumors:dartfrog:gliderlabs.os";

export interface Rumor {
  id: number;
  text: string;
  time: number;
  source: string | null;
}

export interface RumorsStore {
  rumors: Rumor[]
  bannedUsers: string[]
  createRumor: (api: ServiceApi, text: string) => void
  banUser: (api: ServiceApi, user: string) => void
  unbanUser: (api: ServiceApi, user: string) => void
  deleteRumor: (api: ServiceApi, rumorId: number) => void
  getRumorAuthor: (api: ServiceApi, rumorId: number) => void
  handleUpdate: (update: any) => void
  get: () => RumorsStore 
  set: (partial: RumorsStore | Partial<RumorsStore>) => void
}

const useRumorsStore = create<RumorsStore>((set, get) => ({
  rumors: [],
  bannedUsers: [],
  
  createRumor: (api, text) => {
    const req = {
      "Rumors": {
        "CreateNewRumor": text
      }
    };
    api.sendToService(req);
  },

  banUser: (api, user) => {
    const req = {
      "Rumors": {
        "BanUser": { user }
      }
    };
    api.sendToService(req);
  },

  unbanUser: (api, user) => {
    const req = {
      "Rumors": {
        "UnbanUser": { user }
      }
    };
    api.sendToService(req);
  },

  deleteRumor: (api, rumorId) => {
    const req = {
      "Rumors": {
        "DeleteRumor": { rumor_id: rumorId }
      }
    };
    api.sendToService(req);
  },

  getRumorAuthor: (api, rumorId) => {
    const req = {
      "Rumors": {
        "GetRumorAuthor": { rumor_id: rumorId }
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
    } else if ('BannedUsers' in update) {
      set({ bannedUsers: update.BannedUsers });
    } else if ('DeletedRumor' in update) {
      set((state) => ({
        rumors: state.rumors.filter(rumor => rumor.id !== update.DeletedRumor)
      }));
    } else if ('RumorAuthor' in update) {
      set((state) => ({
        rumors: state.rumors.map(rumor => 
          rumor.id === update.RumorAuthor.rumor_id
            ? { ...rumor, source: update.RumorAuthor.author }
            : rumor
        )
      }));
    } else {
      console.warn('Unknown update type:', update);
    }
  },
  
  get,
  set,
}))

export default useRumorsStore;
