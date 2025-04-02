import { create } from 'zustand'

import {ServiceApi} from '@dartfrog/puddle';
export const PLUGIN_NAME = "page:dartfrog:gliderlabs.os";




export interface PageStore {
  page: string | null,
  setPage: (page: string) => void
  //
  sendPageEdit: (api:ServiceApi, text: string) => void
  // 
  get: () => PageStore 
  set: (partial: PageStore | Partial<PageStore>) => void
}

const usePageStore = create<PageStore>((set, get) => ({
  // 
  page: null,
  setPage: (page) => set({ page }),
  // 
  sendPageEdit: (api, text) => {
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

export default usePageStore;
