import { create } from 'zustand'
import DartApi, { AvailableServices, ParsedServiceId, Service, ServiceId, parseServiceId } from '@dartfrog/puddle';

export const PLUGIN_NAME = "page:dartfrog:herobrine.os";




export interface PageStore {
  serviceId: string | null,
  setServiceId: (service: string) => void
  api: DartApi | null,
  setApi: (api: DartApi) => void
  //
  page: string | null,
  setPage: (page: string) => void
  //
  sendPageEdit: (text: string) => void
  // 
  nameColors: Map<string, string>
  addNameColor: (name:string, color:string) => void
  // 
  get: () => PageStore 
  set: (partial: PageStore | Partial<PageStore>) => void
}

const usePageStore = create<PageStore>((set, get) => ({
  serviceId: null,
  setServiceId: (serviceId) => set({ serviceId }),
  api: null,
  setApi: (api) => set({ api }),
  // 
  page: null,
  setPage: (page) => set({ page }),
  // 
  sendPageEdit: (text) => {
    const { api, serviceId } = get();
    if (!api) { return; }
    if (!serviceId) { return; }
    let innerPluginRequest = 
      {
      "EditPage": 
        text
      }
    api.pokePlugin(serviceId, PLUGIN_NAME, innerPluginRequest);
  },
  // 
  nameColors: new Map<string, string>(),
  addNameColor: (name:string, color:string) => {
    const { nameColors } = get()
    nameColors[name] = color;
    set({ nameColors: nameColors })
  },
  // 
  get,
  set,
}))

export default usePageStore;
