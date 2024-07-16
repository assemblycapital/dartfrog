import { create } from 'zustand'
import {ServiceApi, ServiceConnectionStatus, ServiceMetadata} from '@dartfrog/puddle';

export const PLUGIN_NAME = "chat:dartfrog:herobrine.os";


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
  api: ServiceApi | null,
  setApi: (api: ServiceApi) => void
  //
  createService: (name: string) => void
  requestMyServices: () => void
  //
  chatState: ChatState,
  setChatState: (chatState: ChatState) => void
  addChatMessage: (message: ChatMessage) => void
  // 
  sendChat: (text: string) => void
  // 
  nameColors: Map<string, string>
  addNameColor: (name:string, color:string) => void
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
  api: null,
  setApi: (api) => set({ api }),
  //
  createService: (name) => {
    const { api } = get();
    if (!api) { return; }
    api.createService(name);
  },
  requestMyServices: () => {
    const { api } = get();
    if (!api) { return; }
    api.requestMyServices();
  },
  chatState: { messages: new Map(), lastUpdateType: "history" },
  setChatState: (chatState) => {  set({ chatState: chatState }) },
  addChatMessage: (message) => {
    const { chatState } = get();
    const newMessages = new Map(chatState.messages);
    newMessages.set(message.id, message);
    set({ chatState: { messages: newMessages, lastUpdateType: "message" } });
  },
  // 
  sendChat: (text) => {
    const { api, serviceId } = get();
    if (!api) { return; }
    if (!serviceId) { return; }
    let innerPluginRequest = 
      {
      "SendMessage": 
        text
      }
    // api.pokePluginService(serviceId, PLUGIN_NAME, innerPluginRequest);
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

export default useChatStore;