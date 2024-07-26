import KinodeClientApi from "@kinode/client-api";
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { HUB_NODE } from '../utils';
import { ActivitySetting, Peer, PeerMap, Profile, Service,  } from "@dartfrog/puddle/index";

export const PACKAGE_ID = "dartfrog:herobrine.os";
export const CHAT_PLUGIN = `chat:${PACKAGE_ID}`;
export const PIANO_PLUGIN = `piano:${PACKAGE_ID}`;
export const PAGE_PLUGIN = `page:${PACKAGE_ID}`;
export const CHESS_PLUGIN = `chess:${PACKAGE_ID}`;
export const INBOX_PLUGIN = `inbox:${PACKAGE_ID}`;

export const STANDARD_PLUGINS = [CHAT_PLUGIN, PIANO_PLUGIN, PAGE_PLUGIN, CHESS_PLUGIN, INBOX_PLUGIN];

export type DartfrogWebpageType = 'home' | 'nodes' | 'messages' | 'services';

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
  isSidebarOpen: boolean
  setIsSidebarOpen: (isSidebarOpen: boolean) => void
  // 
  requestLocalServiceList: () => void
  localFwdPeerRequest: (node:string) => void
  localFwdAllPeerRequests: () => void
  localDeletePeer: (node:string) => void
  deleteService: (serviceIdStr: string) => void
  createService: (serviceName, processName, visibility, access, whitelist) => void
  // 
  localServices: Service[],
  setLocalServices: (services: Service[]) => void,
  // 
  peerMap: PeerMap,
  putPeerMap: (peer:Peer) => void,
  delPeerMap: (node:string) => void,
  //
  messageStoreMap: Map<string, MessageStore>,
  setMessageStoreMap: (messageStoreMap: Map<string, MessageStore>) => void,
  putMessageStoreMap: (messageStore: MessageStore) => void,
  requestNewMessageStore: (node: string) => void,
  requestSendMessage: (node, text) => void,
  // 
  profile: Profile | null,
  setProfile: (profile) => void,
  requestSetProfile: (profile) => void,
  activitySetting: ActivitySetting | null,
  setActivitySetting: (setting) => void,
  // 
  currentPage: DartfrogWebpageType,
  setCurrentPage: (page: DartfrogWebpageType) => void,
  // 
  get: () => DartStore 
  set: (partial: DartStore | Partial<DartStore>) => void
}

const useDartStore = create<DartStore>()(
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
    // 
    isSidebarOpen: true,
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
    localFwdAllPeerRequests: () => {
      const { api } = get()
      if (!(api)) return;
      api.send({data:
            "LocalFwdAllPeerRequests"
      })
    },
    localDeletePeer: (node) => {
      const { api } = get()
      if (!(api)) return;
      api.send({data:
        {
          "LocalDeletePeer":
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
            processName,
            access,
            visibility,
            whitelist
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
      const newPeerMap = new Map(peerMap);
      newPeerMap.set(peer.node, peer);
      set({ peerMap: newPeerMap });
    },
    delPeerMap: (node:string) => {
      const { peerMap } = get();
      const newPeerMap = new Map(peerMap);
      newPeerMap.delete(node)
      set({ peerMap: newPeerMap });
    },
    // 
    profile: null,
    setProfile: (profile) => set({ profile }),
    requestSetProfile: (profile) => {
      const { api } = get()
      if (!(api)) return;
      api.send({data:
        {
          "SetProfile": 
            { pfp: profile.pfp,
              bio: profile.bio,
              name_color: profile.nameColor,
            }
        }
      })
    },
    activitySetting: null,
    setActivitySetting: (setting) => set({ activitySetting: setting }),
    // 
    currentPage: 'home',
    setCurrentPage: (page) => set({ currentPage: page }),
    // 
    get,
    set,
    //
    messageStoreMap: new Map<string, MessageStore>(),
    setMessageStoreMap: (messageStoreMap) => set({ messageStoreMap }),
    putMessageStoreMap: (messageStore) => {
      const { messageStoreMap } = get();
      const newMessageStoreMap = new Map(messageStoreMap);
      newMessageStoreMap.set(messageStore.peer_node, messageStore);
      set({ messageStoreMap: newMessageStoreMap });
    },
    requestNewMessageStore: (node) => {
      const { api } = get()
      if (!(api)) return;
      api.send({data:
        {
          "LocalDirectMessages": 
          { "CreateMessageStore": node
          }
        }
      })
    },
    requestSendMessage: (node, text) => {
      const { api } = get()
      if (!(api)) return;
      api.send({data:
        {
          "LocalDirectMessages": 
          { "SendMessage": [node, text]
          }
        }
      })
    },
  })
)

export default useDartStore;

export interface MessageStore {
  peer_node: string;
  history: DirectMessage[];
}

export interface DirectMessage {
  id: string;
  from: string;
  is_unread: boolean;
  contents: string;
}

export function createMessageStore(peer_node: string): MessageStore {
  return {
    peer_node,
    history: [],
  };
}