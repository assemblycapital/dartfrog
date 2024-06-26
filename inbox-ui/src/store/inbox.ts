import { create } from 'zustand'
import DartApi, { AvailableServices, ParsedServiceId, Service, ServiceId, parseServiceId } from '@dartfrog/puddle';

export const PLUGIN_NAME = "inbox:dartfrog:herobrine.os";

// Define TypeScript interfaces based on Rust structs
export type InboxMessage = {
  sender: string;
  message: string;
  time: number;
}

 export type Inbox = {
  messages: InboxMessage[];
  has_unread: boolean;
}

export type InboxService = {
  inboxes: Map<string, Inbox>;
}

export interface inboxStore {
  serviceId: string | null,
  setServiceId: (service: string) => void
  api: DartApi | null,
  setApi: (api: DartApi) => void

  nameColors: Map<string, string>
  addNameColor: (name:string, color:string) => void
  // 
  get: () => inboxStore 
  set: (partial: inboxStore | Partial<inboxStore>) => void
  // Add new state for InboxService
  inboxService: InboxService | null,
  setInboxService: (inboxService: InboxService) => void
  setInboxFromUpdate: (user:string, inbox: Inbox) => void
  //
  requestInbox: (user: string) => void
  requestAllInboxes: () => void
  //
  sendMessage: (user:string, message:string) => void
  //
  createInbox: (user:string) => void
  readInbox: (user:string) => void
}

const useInboxStore = create<inboxStore>((set, get) => ({
  serviceId: null,
  setServiceId: (serviceId) => set({ serviceId }),
  api: null,
  setApi: (api) => set({ api }),


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
  // Initialize new state for InboxService
  inboxService: null,
  setInboxService: (inboxService) => set({ inboxService }),
  setInboxFromUpdate: (user: string, inbox: Inbox) => {
    const {inboxService} = get()
    if (!(inboxService)) {
      return;
    }
    inboxService.inboxes.set(user, inbox)
    set({inboxService: inboxService})
  },
  //
  requestInbox: (user: string) => {
    const { api, serviceId } = get();
    api.pokePluginService(serviceId, PLUGIN_NAME, { RequestInbox: user });
  },
  requestAllInboxes: () => {
    const { api, serviceId } = get();
    api.pokePluginService(serviceId, PLUGIN_NAME, { RequestAllInboxes: null });
  },
  sendMessage: (user:string, message:string) => {
    const { api, serviceId } = get();
    api.pokePluginService(serviceId, PLUGIN_NAME, { HostSendMessage: [user, message]});
  },
  createInbox: (user: string) => {
    const { api, serviceId } = get();
    api.pokePluginService(serviceId, PLUGIN_NAME, { CreateInbox: user});
  },
  readInbox: (user: string) => {
    const { api, serviceId } = get();
    api.pokePluginService(serviceId, PLUGIN_NAME, { ReadInbox: user});
  }
}))

export default useInboxStore;
