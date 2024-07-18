import KinodeClientApi from "@kinode/client-api";
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { HUB_NODE } from '../utils';
import { Peer, PeerMap, Service,  } from "@dartfrog/puddle/index";

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
  requestLocalServiceList: () => void
  localFwdPeerRequest: (node:string) => void
  deleteService: (serviceIdStr: string) => void
  createService: (serviceName, processName, visibility, access, whitelist) => void
  // 
  localServices: Service[],
  setLocalServices: (services: Service[]) => void,
  // 
  peerMap: PeerMap,
  putPeerMap: (peer:Peer) => void,
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
      requestLocalServiceList: () => {
        const { api } = get()
        if (!(api)) return;
        api.send({data:
            "RequestLocalServiceList"
        })
      },
      localFwdPeerRequest: (node:string) => {
        const { api } = get()
        if (!(api)) return;
        api.send({data:
            {
              "LocalFwdPeerRequest":
                node
            }
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
      localServices: [],
      setLocalServices: (services) => {
        set({localServices: services})
      },
      // 
      peerMap: new Map<string, Peer>(),
      putPeerMap: (peer) => {
        const { peerMap } = get();
        console.log("putting in peer map", peer);
        const newPeerMap = new Map(peerMap);
        newPeerMap.set(peer.node, peer);
        set({ peerMap: newPeerMap });
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

export default useDartStore;