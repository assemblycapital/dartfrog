import { create } from 'zustand'
import DartApi, { AvailableServices, ParsedServiceId, Service, ServiceId, parseServiceId } from '@dartfrog/puddle';

export const PLUGIN_NAME = "inbox:dartfrog:herobrine.os";




export interface inboxStore {
  serviceId: string | null,
  setServiceId: (service: string) => void
  api: DartApi | null,
  setApi: (api: DartApi) => void
  //
  inbox: string | null,
  setInbox: (inbox: string) => void
  //
  sendInboxEdit: (text: string) => void
  // 
  nameColors: Map<string, string>
  addNameColor: (name:string, color:string) => void
  // 
  get: () => inboxStore 
  set: (partial: inboxStore | Partial<inboxStore>) => void
}

const useinboxStore = create<inboxStore>((set, get) => ({
  serviceId: null,
  setServiceId: (serviceId) => set({ serviceId }),
  api: null,
  setApi: (api) => set({ api }),
  // 
  inbox: null,
  setInbox: (inbox) => set({ inbox }),
  // 
  sendInboxEdit: (text) => {
    // const { api, serviceId } = get();
    // if (!api) { return; }
    // if (!serviceId) { return; }
    // let innerPluginRequest = 
    //   {
    //   "Editinbox": 
    //     text
    //   }
    // api.pokePluginService(serviceId, PLUGIN_NAME, innerPluginRequest);
    // TODO
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

export default useinboxStore;
