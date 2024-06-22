import { create } from 'zustand'
import DartApi, { AvailableServices, ParsedServiceId, Service, ServiceId, parseServiceId } from '@dartfrog/puddle';

export const PLUGIN_NAME = "piano:dartfrog:herobrine.os";




export interface PianoStore {
  serviceId: string | null,
  setServiceId: (service: string) => void
  api: DartApi | null,
  setApi: (api: DartApi) => void
  //
  sendPlayNote: (text: string) => void
  // 
  nameColors: Map<string, string>
  addNameColor: (name:string, color:string) => void
  // 
  get: () => PianoStore 
  set: (partial: PianoStore | Partial<PianoStore>) => void
}

const usePianoStore = create<PianoStore>((set, get) => ({
  serviceId: null,
  setServiceId: (serviceId) => set({ serviceId }),
  api: null,
  setApi: (api) => set({ api }),
  // 
  sendPlayNote: (text) => {
    const { api, serviceId } = get();
    if (!api) { return; }
    if (!serviceId) { return; }
    let innerPluginRequest = 
      {
      "PlayNote": 
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

export default usePianoStore;
