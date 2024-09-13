import KinodeClientApi from "@kinode/client-api";
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ActivitySetting, Peer, PeerMap, Profile, Service, ServiceCreationOptions, ServiceEditOptions } from "@dartfrog/puddle";

export const PACKAGE_ID = "dartfrog:herobrine.os";
export const CHAT_PLUGIN = `chat:${PACKAGE_ID}`;
export const PIANO_PLUGIN = `piano:${PACKAGE_ID}`;
export const PAGE_PLUGIN = `page:${PACKAGE_ID}`;
export const CHESS_PLUGIN = `chess:${PACKAGE_ID}`;
export const RADIO_PLUGIN = `radio:${PACKAGE_ID}`;
export const FORUM_PLUGIN = `forum:${PACKAGE_ID}`;
export const RUMORS_PLUGIN= `rumors:${PACKAGE_ID}`;

export const STANDARD_PLUGINS = [CHAT_PLUGIN, PIANO_PLUGIN, PAGE_PLUGIN, CHESS_PLUGIN, RADIO_PLUGIN, FORUM_PLUGIN, RUMORS_PLUGIN];

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
  pokeHeartbeat: () => void
  pokeRequestVersion: () => void
  // 
  isSidebarOpen: boolean
  setIsSidebarOpen: (isSidebarOpen: boolean) => void
  // 
  requestLocalServiceList: () => void
  localFwdPeerRequest: (node:string) => void
  localFwdAllPeerRequests: () => void
  localDeletePeer: (node:string) => void
  deleteService: (serviceIdStr: string) => void
  createService: (options: ServiceCreationOptions) => void
  editService: (serviceId: string, options: ServiceEditOptions) => void
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
  clearUnreadMessageStore: (node) => void,
  // 
  profile: Profile | null,
  setProfile: (profile) => void,
  requestSetProfile: (profile) => void,
  activitySetting: ActivitySetting | null,
  setActivitySetting: (setting) => void,
  requestSetActivitySetting: (setting) => void,
  // 
  currentPage: DartfrogWebpageType,
  setCurrentPage: (page: DartfrogWebpageType) => void,
  // 
  get: () => DartStore 
  set: (partial: DartStore | Partial<DartStore>) => void,
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
    pokeHeartbeat: () => {
      const { api } = get();
      if (!api) { return; }
      api.send({ data: 'Heartbeat' });
    },
    pokeRequestVersion: () => {
      const { api } = get();
      if (!api) { return; }
      api.send({ data: 'RequestVersion' });
    },
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
    createService: (options: ServiceCreationOptions) => {
      const { api } = get()
      if (!(api)) return;
      api.send({data:
        {
          "CreateService": {
            service_name: options.serviceName,
            process_name: options.processName,
            access: options.access,
            visibility: options.visibility,
            whitelist: options.whitelist,
            title: options.title,
            description: options.description,
            publish_user_presence: options.publishUserPresence,
            publish_subscribers: options.publishSubscribers,
            publish_subscriber_count: options.publishSubscriberCount,
            publish_whitelist: options.publishWhitelist
          }
        }
      })
    },
    editService: (serviceId: string, options: ServiceEditOptions) => {
      const { api } = get();
      if (!api) return;
      api.send({
        data: {
          "EditService": {
            id: serviceId,
            options: {
              title: options.title,
              description: options.description,
              access: options.access,
              visibility: options.visibility,
              whitelist: options.whitelist,
              publish_user_presence: options.publishUserPresence,
              publish_subscribers: options.publishSubscribers,
              publish_subscriber_count: options.publishSubscriberCount,
              publish_whitelist: options.publishWhitelist
            }
          }
        }
      });
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
    requestSetActivitySetting: (setting) => {
      const { api } = get()
      if (!(api)) return;
      api.send({data:
        {
          "SetActivitySetting": 
            setting
        }
      })

    },
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
    clearUnreadMessageStore: (node) => {
      const { api } = get()
      if (!(api)) return;
      api.send({data:
        {
          "LocalDirectMessages": 
            {
              "ClearUnreadMessageStore": node
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
  time_received: number;
}

export function createMessageStore(peer_node: string): MessageStore {
  return {
    peer_node,
    history: [],
  };
}