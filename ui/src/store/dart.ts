import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import KinodeClientApi from "@kinode/client-api";
import { SERVER_NODE, WEBSOCKET_URL } from '../utils';

export interface DartStore {
  api: KinodeClientApi | null,
  setApi: (api: KinodeClientApi) => void
  handleWsMessage: (json: string | Blob) => void
  sendPoke: (data) => void
  pokeSubscribe: () => void
  pokeUnsubscribe: () => void
  initialize: () => void
  get: () => DartStore
  set: (partial: DartStore | Partial<DartStore>) => void
}

const useDartStore = create<DartStore>()(
  persist(
    (set, get) => ({
      api: null,
      setApi: (api) => set({ api }),
      handleWsMessage: (json: string | Blob) => {
        if (typeof json !== 'string') { return; }
        console.log('got json', json)
      },
      sendPoke: (data) => {
        const { api } = get();
        if (!api) { return; }
        api.send({ data: data });
      },
      pokeSubscribe: () => {
        const { sendPoke, api } = get();
        if (!api) { return; }
        const data = 
            {"ClientRequest": {"InnerClient": [0, {"JoinService":{"node": SERVER_NODE, "id":"TODO"}}]}}
        sendPoke(data);
      },
      pokeUnsubscribe: () => {
        const { sendPoke, api } = get();
        if (!api) { return; }
        const data = 
            {"ClientRequest": {"InnerClient": [0, {"ExitService":{"node": SERVER_NODE, "id":"TODO"}}]}}
        sendPoke(data);
      },
      initialize: () => {
          console.log("Attempting to connect to Kinode...");
          if (!(window.our?.node && window.our?.process)) {
            return;
          }
          const { setApi, pokeSubscribe, handleWsMessage } = get();
          const newApi = new KinodeClientApi({
            uri: WEBSOCKET_URL,
            nodeId: window.our.node,
            processId: window.our.process,
            onClose: (_event) => {
              console.log("Disconnected from Kinode");
            },
            onOpen: (_event, _api) => {
              console.log("Connected to Kinode");
              pokeSubscribe();
            },
            onMessage: (json, _api) => {
              handleWsMessage(json);
            },
            onError: (ev) => {
              console.log("Kinode connection error", ev);
            },
          });
          setApi(newApi);
        },
      get,
      set,
    }),
    {
      name: 'dart', // unique name
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    }
  )
)

export default useDartStore
