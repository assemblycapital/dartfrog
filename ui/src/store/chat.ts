import { create } from 'zustand'
import { ChatMessage, UserActivity } from '../types/types'
import { persist, createJSONStorage } from 'zustand/middleware'
import KinodeClientApi from "@kinode/client-api";

export interface ChatStore {
  chats: Map<number, ChatMessage>
  setChats: (new_chats: Map<number, ChatMessage>) => void
  addMessage: (msg: ChatMessage) => void
  userActivity: Array<UserActivity>
  setUserActivity: (act: Array<UserActivity>) => void
  nameColors: Map<string, string>, 
  addNameColor: (name:string, color:string) => void
  bannedUsers: Array<String>, 
  setBannedUsers: (banned: Array<String>) => void
  muteSoundEffects: boolean
  setMuteSoundEffects: (mute: boolean) => void
  api: KinodeClientApi | null,
  setApi: (api: KinodeClientApi) => void
  handleWsMessage: (json: string | Blob) => void
  get: () => ChatStore
  set: (partial: ChatStore | Partial<ChatStore>) => void
}

const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: new Map<number, ChatMessage>(),
      setChats: (new_chats: Map<number, ChatMessage> ) => {
          set({chats: new_chats});
        },
      addMessage: (new_chat: ChatMessage) => {
        const { chats } = get();
        const newChats = new Map(chats);
        newChats.set(new_chat.id, new_chat);
        set({ chats: newChats });
      },
      userActivity: [],
      setUserActivity: (act: Array<UserActivity>) => set({ userActivity: act }),
      nameColors: new Map<string, string>(),
      addNameColor: (name:string, color:string) => {
        const { nameColors } = get()
        nameColors[name] = color;
        set({ nameColors: nameColors })
      },
      bannedUsers: [],
      setBannedUsers: (banned: Array<String>) => set({ bannedUsers: banned }),
      muteSoundEffects: false,
      setMuteSoundEffects: (mute: boolean) => set({ muteSoundEffects: mute }),
      api: null,
      setApi: (api) => set({ api }),
      handleWsMessage: (json: string | Blob) => {
        // This function will be called when the websocket receives a message.
        // Right now you only care about progress messages, but you could add more types of messages here.
        const { muteSoundEffects, setChats, addMessage, setUserActivity, setBannedUsers} = get()
        if (typeof json === 'string') {
          try {
            const data = JSON.parse(json);
            const [messageType] = Object.keys(data);
            if (!messageType) return;
            if (messageType !== "WsUpdate") {
              return
            }
            let upd = data.WsUpdate;
            if (upd["NewChat"]) {
              let msg = upd["NewChat"];
              let chat : ChatMessage = {
                id: msg['id'],
                time: msg['time'],
                from: msg['from'],
                msg: msg['msg']
              }
              maybePlaySoundEffect(chat.msg, muteSoundEffects);
              addMessage(chat);
            } else if (upd["NewChatState"]){
              let cs = upd["NewChatState"];
              setChats(messageHistoryFromList(cs['chat_history']));
              let activity: UserActivity[] =
                Object.entries(cs['user_presence']).map(([key, value]) => ({ name: key, time: value as number}));
              setUserActivity(activity);
              setBannedUsers(cs['banned_users']);
            } else if (upd["NewPresenceState"]) {
              let up = upd["NewPresenceState"];
              let activity: UserActivity[] =
                Object.entries(up).map(([key, value]) => ({ name: key, time: value as number}));
              setUserActivity(activity);
            } else {
              console.log('Unknown message type', upd)
            }
          } catch (error) {
            console.error("Error parsing WebSocket message", error);
          }
        } else {
            console.log('WS: GOT BLOB', json)
        }
      },
      get,
      set,
    }),
    {
      name: 'chat', // unique name
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    }
  )
)

const soundEffectCommands = {
  '/fart': 'assets/wet.mp3',
}

const maybePlaySoundEffect = (msg: string, muteSoundEffects: boolean) => {
  if (muteSoundEffects) {
    return;
  }
  if (msg in soundEffectCommands) {
    const sound = new Audio(soundEffectCommands[msg]);
    sound.play();
  }
}

const messageHistoryFromList = (newMessages: Array<ChatMessage>) => {
  const updatedMessages = new Map();
  newMessages.forEach((message) => {
    updatedMessages.set(message.id, message);
  });
  return updatedMessages;
}
export default useChatStore
