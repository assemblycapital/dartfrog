import { create } from 'zustand'
import DartApi, { AvailableServices, ParsedServiceId, Service, ServiceId, } from '@dartfrog/puddle';

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
  api: DartApi | null,
  setApi: (api: DartApi) => void
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
  api: null,
  setApi: (api) => set({ api }),
  // 
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
    api.pokePluginService(serviceId, PLUGIN_NAME, innerPluginRequest);
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
