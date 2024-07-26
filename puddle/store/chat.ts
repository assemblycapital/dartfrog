import { create } from 'zustand'
import {Peer, PeerMap, Service, ServiceApi, ServiceConnectionStatus, ServiceMetadata} from '@dartfrog/puddle';
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

export interface ChatStore {
  serviceId: string | null,
  setServiceId: (service: string) => void
  serviceMetadata: ServiceMetadata | null,
  setServiceMetadata: (meta: ServiceMetadata) => void,
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
  createService: (serviceName, visibility, access, whitelist) => void
  deleteService: (name: string) => void
  requestPeer: (node:string) => void
  requestMyServices: () => void
  //
  chatState: ChatState,
  setChatState: (chatState: ChatState) => void
  addChatMessage: (message: ChatMessage) => void
  setChatHistory: (history: ChatMessage[]) => void
  // 
  sendChat: (text: string) => void
  // 
  get: () => ChatStore 
  set: (partial: ChatStore | Partial<ChatStore>) => void
}

const useChatStore = create<ChatStore>((set, get) => ({
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
  setApi: (api) => set({ api }),
  //
  createService: (serviceName, access, visibility, whitelist) => {
    const { api } = get()
    if (!(api)) return;
    api.createService(
          serviceName,
          access,
          visibility,
          whitelist,
    )
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
    const { chatState } = get();
    const newMessages = new Map(chatState.messages);
    newMessages.set(message.id, message);
    maybePlaySoundEffect(message.msg);
    maybePlayTTS(message.msg);
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
  //
  peerMap: new Map(),
  setPeerMap: (newPeerMap) => {
    set({ peerMap: newPeerMap });
  },
  newPeer: (node) => {
    const { api } = get();
    if (!api) { return; }
    api.requestPeer(node);
  },
  //
  get,
  set,
}))

export default useChatStore;