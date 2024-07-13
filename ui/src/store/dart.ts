import KinodeClientApi from "@kinode/client-api";
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { HUB_NODE } from '../utils';
import { ServiceList, ServiceMap } from "@dartfrog/puddle/index";

export const PACKAGE_ID = "dartfrog:herobrine.os";
export const CHAT_PLUGIN = `chat:${PACKAGE_ID}`;
export const PIANO_PLUGIN = `piano:${PACKAGE_ID}`;
export const PAGE_PLUGIN = `page:${PACKAGE_ID}`;
export const CHESS_PLUGIN = `chess:${PACKAGE_ID}`;
export const INBOX_PLUGIN = `inbox:${PACKAGE_ID}`;

export const STANDARD_PLUGINS = [CHAT_PLUGIN, PIANO_PLUGIN, PAGE_PLUGIN, CHESS_PLUGIN, INBOX_PLUGIN];

export interface DartStore {
  api: KinodeClientApi | null,
  setApi: (api: KinodeClientApi) => void
  closeApi: () => void
  // 
  sendPoke: (data) => void
  // 
  isClientConnected: boolean
  setIsClientConnected: (isClientConnected: boolean) => void
  // 
  // chat stuff here until its properly abstracted later
  nameColors: Map<string, string>
  addNameColor: (name:string, color:string) => void
  // 
  isSidebarOpen: boolean
  setIsSidebarOpen: (isSidebarOpen: boolean) => void
  // 
  requestServiceList: (node) => void
  requestFullServiceList: () => void
  deleteService: (serviceIdStr: string) => void
  createService: (serviceName, processName, visibility, access, whitelist) => void
  // 
  serviceMap: ServiceMap
  putServiceMap: (node:string, services: ServiceList) => void
  // 
  get: () => DartStore 
  set: (partial: DartStore | Partial<DartStore>) => void
}

const useDartStore = create<DartStore>()(
  // persist(
    (set, get) => ({
      api: null,
      setApi: (api) => set({ api }),
      closeApi: () => {
        const { api } = get();
        if (!api) { return; }
        // api.close();
      },
      sendPoke: (data) => {
        const { api } = get();
        if (!api) { return; }
        api.send({ data: data });
      },
      isClientConnected: false,
      setIsClientConnected: (isClientConnected) => set({ isClientConnected }),
      // chat stuff
      nameColors: new Map<string, string>(),
      addNameColor: (name:string, color:string) => {
        const { nameColors } = get()
        nameColors[name] = color;
        set({ nameColors: nameColors })
      },
      // 
      isSidebarOpen: false,
      setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
      // 
      requestServiceList: (node:string) => {
        const { api } = get()
        if (!(api)) return;
        api.send({data:
            {
            "RequestServiceList":
              node
            }
        })
      },
      requestFullServiceList: () => {
        const { api } = get()
        if (!(api)) return;
        api.send({data:
            "RequestFullServiceList"
        })
      },
      deleteService: (serviceIdStr) => {
        const { api } = get()
        if (!(api)) return;
        api.send({data:
          {
            "DeleteService":
            serviceIdStr
          }
        })

      },
      createService: (serviceName, processName, visibility, access, whitelist) => {
        const { api } = get()
        if (!(api)) return;
        api.send({data:
          {
            "CreateService": [
              serviceName,
              processName
            ]
          }
        })
      },
      // 
      serviceMap: new Map<string, ServiceList>(),
      putServiceMap: (node, services) => {
        const { serviceMap } = get();
        const newServiceMap = new Map(serviceMap);
        newServiceMap.set(node, services);
        set({ serviceMap: newServiceMap });
      },
      // 
      get,
      set,
    }),
    // {
    //   name: 'dart', // unique name
    //   storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    // }
  // )
)

const parsePresence = (presence: any) => {
  return Object.entries(presence).map(([key, value]) => ({
      name: key,
      time: value['time'] as number,
      was_online_at_time: value['was_online_at_time'] as boolean
    }));
}


export default useDartStore;