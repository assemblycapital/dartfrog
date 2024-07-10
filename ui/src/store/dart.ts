import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import DartApi, { AvailableServices, ParsedServiceId, PerNodeAvailableServices, Service, ServiceAccess, ServiceId, ServiceVisibility, parseServiceId } from '@dartfrog/puddle';
import { HUB_NODE } from '../utils';

export const PACKAGE_ID = "dartfrog:herobrine.os";
export const CHAT_PLUGIN = `chat:${PACKAGE_ID}`;
export const PIANO_PLUGIN = `piano:${PACKAGE_ID}`;
export const PAGE_PLUGIN = `page:${PACKAGE_ID}`;
export const CHESS_PLUGIN = `chess:${PACKAGE_ID}`;
export const INBOX_PLUGIN = `inbox:${PACKAGE_ID}`;

export const STANDARD_PLUGINS = [CHAT_PLUGIN, PIANO_PLUGIN, PAGE_PLUGIN, CHESS_PLUGIN, INBOX_PLUGIN];

export interface Tab {
  serviceId: ServiceId | null;
}

export interface DartStore {
  api: DartApi | null,
  setApi: (api: DartApi) => void
  closeApi: () => void
  // 
  handleUpdate: (json: string | Blob) => void
  // 
  sendPoke: (data) => void
  // 
  isClientConnected: boolean
  setIsClientConnected: (isClientConnected: boolean) => void
  services: Map<ServiceId, Service>
  setServices: (services: Map<ServiceId, Service>) => void
  exitService: (serviceId: ServiceId) => void
  joinService: (serviceId: ServiceId) => void
  pokeService: (parsedServiceId: ServiceId, data:any) => void
  createService: (serviceId: ServiceId, plugin: String, visibility: ServiceVisibility, access: ServiceAccess, whitelist: Array<String>) => void
  deleteService: (serviceId: ServiceId) => void
  requestServiceList: (serverNode: ServiceId) => void
  requestAllServiceList: () => void
  availableServices: PerNodeAvailableServices
  setAvailableServices: (availableServices: PerNodeAvailableServices) => void
  // 
  // chat stuff here until its properly abstracted later
  nameColors: Map<string, string>
  addNameColor: (name:string, color:string) => void
  //
  hasUnreadInbox: boolean
  setHasUnreadInbox: (has:boolean) => void
  // 
  isSidebarOpen: boolean
  setIsSidebarOpen: (isSidebarOpen: boolean) => void
  tabs: Tab[];
  activeTabIndex: number;
  setTabs: (tabs: Tab[]) => void;
  setActiveTabIndex: (index: number) => void;
  addTab: (maybeServiceId: ServiceId | null) => void;
  closeTab: (index: number) => void;
  setFromNewTab: (serviceId: string) => void;
  // 
  authDialog: string[];
  setAuthDialog: (plugins: string[]) => void;
  clearPluginFromAuthDialog: (plugin: string) => void;
  isAuthDialogActive: boolean;
  setIsAuthDialogActive: (isActive:boolean) => void;
  // 
  get: () => DartStore 
  set: (partial: DartStore | Partial<DartStore>) => void
}

const useDartStore = create<DartStore>()(
  // persist(
    (set, get) => ({
      api: null,
      setApi: (api) => set({ api }),
      closeApi: () => {
        const { api } = get();
        if (!api) { return; }
        api.close();
        set({ api: null });
      },
      handleUpdate: (json: string | Blob) => {
        // console.log('TODO?', json);
      },
      sendPoke: (data) => {
        const { api } = get();
        if (!api) { return; }
        api.sendPoke({ data: data });
      },
      isClientConnected: false,
      setIsClientConnected: (isClientConnected) => set({ isClientConnected }),
      services: new Map(),
      setServices: (services) => {
        set({ services: new Map(services) })
      },
      exitService: (serviceId: ServiceId) => {
        const { api } = get();
        if (!api) { return; }

        api.exitService(serviceId);
      },
      joinService: (serviceId: ServiceId) => {
        const { api } = get();
        if (!api) { return; }

        api.joinService(serviceId);
      },
      pokeService: (serviceId: ServiceId, data:any) => {
        const { api } = get();
        if (!api) { return; }

        // console.log('pokeService', parsedServiceId, data)
        let parsedServiceId = parseServiceId(serviceId);
        if (!parsedServiceId) return;

        const request =  { "SendToService": 
        [
          { "node": parsedServiceId.node, "id": parsedServiceId.id },
          data,
        ]
      }
        api.sendRequest(request);
      },
      createService: (serviceId: ServiceId, plugin: String, visibility: ServiceVisibility, access: ServiceAccess, whitelist: Array<String>) => {
        const { api } = get();
        if (!api) { return; }
        let parsedServiceId = parseServiceId(serviceId);
        if (!parsedServiceId) return;
        api.sendCreateServiceRequest(parsedServiceId, plugin, visibility, access, whitelist);

      },
      deleteService: (serviceId: ServiceId) => {
        const { api } = get();
        if (!api) { return; }
        let parsedServiceId = parseServiceId(serviceId);
        if (!parsedServiceId) return;
        api.sendDeleteServiceRequest(parsedServiceId);

      },
      requestServiceList: (serverNode: string) => {
        const { api } = get();
        if (!api) { return; }
        api.requestServiceList(serverNode);

      },
      requestAllServiceList: () => {
        const { api } = get();
        if (!api) { return; }
        api.requestAllInServiceList();

      },
      availableServices: new Map(),
      setAvailableServices: (availableServices) => {
        // console.log('setAvailableServices', new Map(availableServices))
        set({ availableServices: new Map(availableServices) })
      },
      // chat stuff
      nameColors: new Map<string, string>(),
      addNameColor: (name:string, color:string) => {
        const { nameColors } = get()
        nameColors[name] = color;
        set({ nameColors: nameColors })
      },
      hasUnreadInbox: false,
      setHasUnreadInbox: (hasUnreadInbox: boolean) => {
        set({ hasUnreadInbox });
      },
      tabs: [
        { serviceId: "hub." + HUB_NODE },
        { serviceId: null },
      ],
      activeTabIndex: 0,
      setTabs: (tabs) => set({ tabs }),
      setActiveTabIndex: (index) => {
        set({ activeTabIndex: index })
        // set({ activeTabServiceId: get().tabs[index].serviceId })
      },
      addTab: (maybeServiceId) => set((state) => {
        const newTabs = [...state.tabs, { serviceId: maybeServiceId }];
        return { tabs: newTabs, activeTabIndex: newTabs.length - 1 };
      }),
      closeTab: (index) => set((state) => {
        const newTabs = state.tabs.filter((_, i) => i !== index);
        const newActiveTabIndex = index === state.activeTabIndex
          ? (state.activeTabIndex === 0 ? 0 : state.activeTabIndex - 1)
          : (index < state.activeTabIndex ? state.activeTabIndex - 1 : state.activeTabIndex);
        return { tabs: newTabs, activeTabIndex: newActiveTabIndex };
      }),
      setFromNewTab: (serviceId) => set((state) => {
        const updatedTabs = [...state.tabs];
        updatedTabs[state.activeTabIndex] = { ...updatedTabs[state.activeTabIndex], serviceId };
        return { tabs: updatedTabs };
      }),
      isSidebarOpen: false,
      setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
      authDialog: [],
      setAuthDialog: (plugins) => set({ authDialog: plugins }),
      clearPluginFromAuthDialog: (plugin) => set((state) => {
        const updatedAuthDialog = state.authDialog.filter((p) => p !== plugin);
        return { authDialog: updatedAuthDialog };
      }),
      isAuthDialogActive: false,
      setIsAuthDialogActive: (isActive) => set({ isAuthDialogActive: isActive }),
      get,
      set,
    }),
    // {
    //   name: 'dart', // unique name
    //   storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    // }
  // )
)

const parsePresence = (presence: any) => {
  return Object.entries(presence).map(([key, value]) => ({
      name: key,
      time: value['time'] as number,
      was_online_at_time: value['was_online_at_time'] as boolean
    }));
}


export default useDartStore;