import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import DartApi, { AvailableServices, ParsedServiceId, Service, ServiceId, parseServiceId } from '@dartfrog/puddle';

export interface DartStore {
  api: DartApi | null,
  setApi: (api: DartApi) => void
  closeApi: () => void
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
  joinService: (serviceId: ParsedServiceId) => void
  pokeService: (parsedServiceId: ParsedServiceId, data:any) => void
  createService: (serviceId: ServiceId, plugins: Array<String>) => void
  deleteService: (serviceId: ServiceId) => void
  requestServiceList: (serviceId: ServiceId) => void
  requestAllServiceList: () => void
  availableServices: AvailableServices
  setAvailableServices: (availableServices: AvailableServices) => void
  // 
  // chat stuff here until its properly abstracted later
  nameColors: Map<string, string>
  addNameColor: (name:string, color:string) => void
  // 
  get: () => DartStore 
  set: (partial: DartStore | Partial<DartStore>) => void
}

const useDartStore = create<DartStore>()(
  persist(
    (set, get) => ({
      api: null,
      setApi: (api) => set({ api }),
      closeApi: () => {
        const { api } = get();
        if (!api) { return; }
        api.close();
        set({ api: null });
      },
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
      setServices: (services) => {
        set({ services: new Map(services) })
      },
      exitService: (serviceId: ParsedServiceId) => {
        const { api } = get();
        if (!api) { return; }

        api.exitService(serviceId);
      },
      joinService: (serviceId: ParsedServiceId) => {
        const { api } = get();
        if (!api) { return; }

        api.joinService(serviceId);
      },
      pokeService: (parsedServiceId: ParsedServiceId, data:any) => {
        const { api } = get();
        if (!api) { return; }

        // console.log('pokeService', parsedServiceId, data)

        const request =  { "SendToService": 
        [
          { "node": parsedServiceId.node, "id": parsedServiceId.id },
          data,
        ]
      }
        api.sendRequest(request);
      },
      createService: (serviceId: ServiceId, plugins: Array<String>) => {
        const { api } = get();
        if (!api) { return; }
        let parsedServiceId = parseServiceId(serviceId);
        api.sendCreateServiceRequest(parsedServiceId, plugins);

      },
      deleteService: (serviceId: ServiceId) => {
        const { api } = get();
        if (!api) { return; }
        let parsedServiceId = parseServiceId(serviceId);
        api.sendDeleteServiceRequest(parsedServiceId);

      },
      requestServiceList: (serverNode: string) => {
        const { api } = get();
        if (!api) { return; }
        api.requestServiceList(serverNode);

      },
      requestAllServiceList: () => {
        const { api } = get();
        if (!api) { return; }
        api.requestAllInServiceList();

      },
      availableServices: new Map(),
      setAvailableServices: (availableServices) => {
        // console.log('setAvailableServices', new Map(availableServices))
        set({ availableServices: new Map(availableServices) })
      },
      // chat stuff
      nameColors: new Map<string, string>(),
      addNameColor: (name:string, color:string) => {
        const { nameColors } = get()
        nameColors[name] = color;
        set({ nameColors: nameColors })
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


export default useDartStore;