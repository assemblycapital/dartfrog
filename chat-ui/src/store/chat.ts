import { create } from 'zustand'
import DartApi, { AvailableServices, ParsedServiceId, Service, ServiceId, parseServiceId } from '@dartfrog/puddle';

export const PLUGIN_NAME = "chat:dartfrog:herobrine.os";


type ChatState = {
  messages: Map<number, ChatMessage>;

}
type ChatMessage = {
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
  chatState: { messages: new Map() },
  setChatState: (chatState) => {  set({ chatState: chatState }) },
  addChatMessage: (message) => {
    const { chatState } = get();
    const newMessages = new Map(chatState.messages);
    newMessages.set(message.id, message);
    set({ chatState: { messages: newMessages } });
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
    api.pokePlugin(serviceId, PLUGIN_NAME, innerPluginRequest);
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
