import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import DartApi, { ParsedServiceId, Service, ServiceId, parseServiceId } from '../dartclientlib';

export interface DartStore{
  api: DartApi | null,
  setApi: (api: DartApi) => void
  // 
  handleUpdate: (json: string | Blob) => void
  // 
  sendPoke: (data) => void
  // 
  isClientConnected: boolean
  setIsClientConnected: (isClientConnected: boolean) => void
  services: Map<ServiceId, Service>
  setServices: (services: Map<ServiceId, Service>) => void
  exitService: (serviceId: ParsedServiceId) => void
  // 
  get: () => DartStore 
  set: (partial: DartStore | Partial<DartStore>) => void
}

const useDartStore = create<DartStore>()(
  persist(
    (set, get) => ({
      api: null,
      setApi: (api) => set({ api }),
      handleUpdate: (json: string | Blob) => {
        console.log('TODO?', json);
      },
      sendPoke: (data) => {
        const { api } = get();
        if (!api) { return; }
        api.sendPoke({ data: data });
      },
      isClientConnected: false,
      setIsClientConnected: (isClientConnected) => set({ isClientConnected }),
      services: new Map(),
      setServices: (services) => set({ services }),
      exitService: (serviceId: ParsedServiceId) => {
        const { api } = get();
        if (!api) { return; }

        api.exitService(serviceId);
      },
      get,
      set,
    }),
    {
      name: 'dart', // unique name
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    }
  )
)

const parsePresence = (presence: any) => {
  return Object.entries(presence).map(([key, value]) => ({
      name: key,
      time: value['time'] as number,
      was_online_at_time: value['was_online_at_time'] as boolean
    }));
}

export default useDartStore
