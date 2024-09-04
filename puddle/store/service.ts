import { create } from 'zustand'
import {Peer, PeerMap, Service, ServiceApi, ServiceConnectionStatus, ServiceMetadata, ServiceCreationOptions, PublicServiceMetadata, ServiceEditOptions} from '@dartfrog/puddle';
import { maybePlaySoundEffect, maybePlayTTS } from '../utils';

export type ChatState = {
  messages: Map<number, ChatMessage>;
  lastUpdateType: "history" | "message";
}

export type ChatMessage = {
  id: number;
  from: string;
  msg: string;
  time: number;
}

export interface ServiceStore {
  serviceId: string | null,
  setServiceId: (service: string) => void
  serviceMetadata: PublicServiceMetadata | null,
  setServiceMetadata: (meta: PublicServiceMetadata) => void,
  serviceConnectionStatus: ServiceConnectionStatus | null,
  setServiceConnectionStatus: (status: ServiceConnectionStatus) => void,
  //
  localServices: Service[],
  setLocalServices: (services:Service[]) => void,
  // 
  peerMap: PeerMap,
  setPeerMap: (newPeerMap:PeerMap) => void,
  newPeer: (node:string) => void,
  //
  api: ServiceApi | null,
  setApi: (api: ServiceApi) => void
  //
  createService: (options: ServiceCreationOptions) => void
  deleteService: (name: string) => void
  requestPeer: (node:string) => void
  requestMyServices: () => void
  //
  chatState: ChatState,
  setChatState: (chatState: ChatState) => void
  addChatMessage: (message: ChatMessage) => void
  setChatHistory: (history: ChatMessage[]) => void
  chatSoundsEnabled: boolean
  setChatSoundsEnabled: (enabled: boolean) => void
  isClientConnected: boolean,
  setIsClientConnected: (isConnected: boolean) => void,

  // 
  sendChat: (text: string) => void
  // 
  get: () => ServiceStore 
  set: (partial: ServiceStore | Partial<ServiceStore>) => void

  editService: (serviceId: string, options: ServiceEditOptions) => void
  fullServiceMetadata: ServiceMetadata | null,
  setFullServiceMetadata: (metadata: ServiceMetadata | null) => void,
}

const useServiceStore = create<ServiceStore>((set, get) => ({
  serviceId: null,
  setServiceId: (serviceId) => set({ serviceId }),
  //
  serviceMetadata: null,
  setServiceMetadata: (serviceMetadata) => set({ serviceMetadata }),
  serviceConnectionStatus: null,
  setServiceConnectionStatus: (serviceConnectionStatus) => set({serviceConnectionStatus}),
  //
  localServices: [],
  setLocalServices: (localServices) => set({localServices}),
  //
  api: null,
  setApi: (api) => {
    set({ api });
  },
  //
  createService: (options: ServiceCreationOptions) => {
    const { api } = get()
    if (!(api)) return;
    api.createService(options)
  },
  deleteService: (name) => {
    const { api } = get();
    if (!api) { return; }
    api.deleteService(name);
  },
  requestMyServices: () => {
    const { api } = get();
    if (!api) { return; }
    api.requestMyServices();
  },
  requestPeer: (node:string) => {
    const { api } = get();
    if (!api) { return; }
    api.requestPeer(node);
  },
  chatState: { messages: new Map(), lastUpdateType: "history" as "history" },
  setChatState: (chatState) => {  set({ chatState: chatState }) },
  addChatMessage: (message) => {
    const { chatState, chatSoundsEnabled } = get();
    const newMessages = new Map(chatState.messages);
    newMessages.set(message.id, message);
    if (chatSoundsEnabled) {
      maybePlaySoundEffect(message.msg);
      maybePlayTTS(message.msg);
    }
    set({ chatState: { messages: newMessages, lastUpdateType: "message" } });
  },
  setChatHistory: (history) => {
    const newMessages = new Map(history.map((msg) => [msg.id, msg]));
    set({ chatState: { messages: newMessages, lastUpdateType: "history" } });
  },
  // 
  sendChat: (text) => {
    const { api, serviceId } = get();
    if (!api) { return; }
    if (!serviceId) { return; }
    api.sendToService({Chat: {SendMessage: text}})
  },
  chatSoundsEnabled: false,
  setChatSoundsEnabled: (enabled: boolean) => {
    set({chatSoundsEnabled: enabled})
  },
  //
  peerMap: new Map(),
  setPeerMap: (newPeerMap) => {
    set({ peerMap: new Map(newPeerMap) });
  },
  newPeer: (node) => {
    const { api } = get();
    if (!api) { return; }
    api.requestPeer(node);
  },
  isClientConnected: false,
  setIsClientConnected: (isConnected: boolean) => set({ isClientConnected: isConnected }),
  //
  editService: (serviceId: string, options: ServiceEditOptions) => {
    const { api } = get();
    if (!api) { return; }
    api.editService(serviceId, options);
  },
  fullServiceMetadata: null,
  setFullServiceMetadata: (meta) => set({fullServiceMetadata: meta}),
  get,
  set,
}))

export default useServiceStore;