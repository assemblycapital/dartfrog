import { create } from 'zustand'

import {ServiceApi} from '@dartfrog/puddle';



export interface ForumStore {
  // page: string | null,
  // setPage: (page: string) => void
  //
  // sendForumRequest: (api:ServiceApi, text: string) => void
  // 
  get: () => ForumStore 
  set: (partial: ForumStore | Partial<ForumStore>) => void
}

const useForumStore = create<ForumStore>((set, get) => ({
  // 
  // page: null,
  // setPage: (page) => set({ page }),
  // // 
  // sendPageEdit: (api, text) => {
  //   let req = 
  //     {
  //     "Page": {
  //       "EditPage": 
  //         text
  //     }
  //   }
  //   api.sendToService(req);
  // },
  // 
  get,
  set,
}))

export default useForumStore;
