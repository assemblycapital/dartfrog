import KinodeClientApi from "@kinode/client-api";
export * from './utils';

export enum ConnectionStatusType {
  Connecting,
  Connected,
  Disconnected,
}

export type ConnectionStatus = {
  status: ConnectionStatusType,
  timestamp: number
}
export type ServiceUpdateHandler = (json: string | Blob) => void;

export type ServiceUpdateHandlers = Map<ServiceId, ServiceUpdateHandler>;

export enum ServiceConnectionStatusType {
  Connecting,
  Connected,
  Disconnected,
  ServiceDoesNotExist,
  Kicked,
}

export type ServiceConnectionStatus = {
  status: ServiceConnectionStatusType,
  timestamp: number
}

export type ParsedServiceId = {
  node: string,
  id: string
}
export type ServiceId = string;

export type Service = {
  serviceId: ParsedServiceId,
  connectionStatus: ServiceConnectionStatus,
  metadata: ServiceMetadata,
  heartbeatIntervalId?: NodeJS.Timeout,
  pluginStates: { [key: string]:
    { exists: boolean, state: any }
  },
}
export interface Presence {
  time: number;
}

export interface ServiceMetadata {
  subscribers: Array<string>;
  user_presence: { [key: string]: Presence };
  plugins: Array<string>;
}

export type Services = Map<ServiceId, Service>;

export const makeServiceId = (node: string, id: string) => {
  return `${id}.${node}`;
}

export const parseServiceId = (serviceId: string) => {
  const split = serviceId.split('.');
  let tlz = split.slice(-1)[0];
  let node_sub = split.slice(-2,-1)[0];
  let id = split.slice(0,-2).join('.');
  const node = `${node_sub}.${tlz}`
  return { node, id };
}

export type AvailableServices = Map<string, Array<ParsedServiceId>>

function new_service(serviceId: ParsedServiceId) : Service {
  return {
    serviceId: serviceId,
    metadata: {subscribers: [], user_presence: {}, plugins: []},
    connectionStatus: {status:ServiceConnectionStatusType.Connecting, timestamp:Date.now()},
    pluginStates: {
    },
  }
}

interface ConstructorArgs {
  our: { node: string, process: string };
  websocket_url: string;
  serviceUpdateHandlers?: ServiceUpdateHandlers;
  onOpen?: () => void;
  onClose?: () => void;
  onServicesChangeHook?: (services: Services) => void;
  onAvailableServicesChangeHook?: (availableServices: AvailableServices) => void;
}

class DartApi {
  private api: KinodeClientApi | null = null;
  public connectionStatus: ConnectionStatus;
  private serviceUpdateHandlers: ServiceUpdateHandlers;
  private services: Map<ServiceId, Service> = new Map();
  private availableServices: AvailableServices = new Map();
  public our: { node: string, process: string };
  public websocket_url: string;

  private onOpen: () => void;
  private onClose: () => void;
  private onServicesChangeHook: (services: Services) => void = () => {};
  private onAvailableServicesChangeHook: (availableServices: AvailableServices) => void = () => {};

  constructor({
    our,
    websocket_url,
    serviceUpdateHandlers = new Map(),
    onOpen = () => {},
    onClose = () => {},
    onServicesChangeHook = (services) => {},
    onAvailableServicesChangeHook = (availableServices) => {},
  }: ConstructorArgs) {
    this.serviceUpdateHandlers = serviceUpdateHandlers;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onServicesChangeHook = onServicesChangeHook;
    this.onAvailableServicesChangeHook = onAvailableServicesChangeHook;
    this.setConnectionStatus(ConnectionStatusType.Connecting);
    this.initialize(our, websocket_url);
  }
  private onServicesChange: () => void = () => {  
    this.onServicesChangeHook(this.services);
  }
  private onAvailableServicesChange: () => void = () => {  
    this.onAvailableServicesChangeHook(this.availableServices);
  }

  public registerServiceUpdateHandler(serviceId: ServiceId, handler: ServiceUpdateHandler) {
    this.serviceUpdateHandlers.set(serviceId, handler);
  }

  private setConnectionStatus(status: ConnectionStatusType) {
    this.connectionStatus = {status:status, timestamp:Date.now()};
  }

  private updateHandler(json: string | Blob) {
    if (typeof json !== 'string') {
        return;
    }
    
    let parsedJson;
    try {
        parsedJson = JSON.parse(json);
    } catch (error) {
        console.error('Failed to parse JSON:', error);
        return;
    }

    if (parsedJson.FromClient) {
        this.handleClientUpdate(parsedJson.FromClient);
    } else if (parsedJson.FromServer) {
        this.handleServerUpdate(parsedJson.FromServer);
    } else if (parsedJson.FromService) {
        this.handleServiceUpdate(parsedJson.FromService);
    } else {
        console.warn('Unknown message format:', parsedJson);
    }
  }

  private handleClientUpdate(message: any) {
      if (message.Todo) {
          // console.log('Client TODO:', message.Todo);
          // Add your logic to handle the client message here
          // For example, if message.Todo is "clientmodule created your service, poking server"
      } else {
          console.warn('Unknown client message:', message);
      }
  }

  private handleServerUpdate(message: any) {
      if (Array.isArray(message) && message.length > 1) {
          const [address, response] = message;
          // console.log('Server Address:', address);
          // console.log('Server Response:', response);

          if (response.NoSuchService) {
              // console.log('No such service:', response.NoSuchService);
              // Add your logic to handle the NoSuchService response here
              let serviceId : ServiceId = makeServiceId(address, response.NoSuchService);
              let service = this.services.get(serviceId);
              if (!service) { return; }
              service.connectionStatus = {status:ServiceConnectionStatusType.ServiceDoesNotExist, timestamp:Date.now()};
              this.services.set(serviceId, service);
              this.onServicesChange();

          } else if (response.ServiceList) {
              // console.log('Service List:', address, response.ServiceList);
              // Add your logic to handle the ServiceList response here
              this.availableServices.set(address, response.ServiceList);
              this.onAvailableServicesChange();
          } else {
              console.warn('Unknown server response:', response);
          }
      } else {
          console.warn('Unknown server message format:', message);
      }
  }


  private handleServiceUpdate(message: any) {
    if (Array.isArray(message) && message.length > 2) {
        const [service_node, service_name, response] = message;
        let serviceId : ServiceId = makeServiceId(service_node, service_name);
        let service = this.services.get(serviceId);

        if (!service) {
          console.log("Service not found", serviceId);
          return;
        }

        // call serviceUpdateHandler if it exists
        const serviceUpdateHandler = this.serviceUpdateHandlers.get(serviceId);
        if (serviceUpdateHandler) {
            serviceUpdateHandler(response);
        }
        
        service.connectionStatus = {status:ServiceConnectionStatusType.Connected, timestamp:Date.now()};
        if (response === "SubscribeAck") {
          this.services.set(serviceId, service);
          this.onServicesChange();
        } else if (response.ServiceMetadata) {
          service.metadata = response.ServiceMetadata;
          for (const plugin of service.metadata.plugins) {
              if (service.pluginStates[plugin] === undefined){
                // initialize plugins
                console.log("Initializing plugin", plugin)
                service.pluginStates[plugin] = {
                    exists: true,
                    state: this.getInitialPluginState(plugin)
                };
              }
          }
          this.services.set(serviceId, service);
          for (let user of Object.keys(response.ServiceMetadata.user_presence)) {
            if (!this.availableServices.has(user)) {
              this.requestServiceList(user);
              this.availableServices.set(user, []);
              this.onAvailableServicesChange();
            }
          }
          this.onServicesChange();
        } else if (response === 'Kick') {
          service.connectionStatus = {status:ServiceConnectionStatusType.Kicked, timestamp:Date.now()};
          this.cancelPresenceHeartbeat(serviceId);
          // TODO?
          // this.services.delete(serviceId);
          this.onServicesChange();
        } else if (response.PluginUpdate) {
          const [plugin_name, update] = response.PluginUpdate;
          this.handlePluginUpdate(plugin_name, update, serviceId, service);
        } else {
          console.warn('Unknown service message format:', message);
        }
    }
  }

  handlePluginUpdate(plugin: string, update: any, serviceId: ServiceId, service: Service) {
    // Ensure the plugin exists in the service, with a default state if not present.
    if (!service.pluginStates[plugin]) {
        // Initialize the plugin state based on the plugin type.
        service.pluginStates[plugin] = {
            exists: true,
            state: this.getInitialPluginState(plugin)
        };
    }

    // Retrieve the update handler for the plugin.
    const updateHandler = this.getPluginUpdateHandler(plugin);
    if (!updateHandler) {
        console.warn('Update handler not found for plugin:', plugin);
        return;
    }

    // Update the state using the specific plugin's update handler.
    const currentState = service.pluginStates[plugin].state;
    const newState = updateHandler(currentState, update);

    // Update the service with the new state.
    const newService = {
      ...service, // Copy all properties of the existing service
      pluginStates: {
          ...service.pluginStates, // Copy all existing plugin states
          [plugin]: { // Update only the specific plugin's state
              ...service.pluginStates[plugin], // Copy the existing plugin's properties
              state: newState // Set the new state
          }
      }
    };

    // Replace the old service with the new one in the services map.
    this.services.set(serviceId, newService);
    this.onServicesChange();
}

// Helper method to return the initial state based on the plugin name.
private getInitialPluginState(plugin: string): any {
    switch (plugin) {
        // case "chat":
        //     return { messages: new Map() };
        // case "piano":
        //     return { notePlayed: null };
        // case "page":
        //     return { page: "" };
        // case "chess":
        //     return newChessState();
        default:
            return null;  // Default state or throw error if plugin is unrecognized.
    }
}

// Helper method to return the update handler function based on the plugin name.
private getPluginUpdateHandler(plugin: string): (currentState: any, update: any) => any {
    switch (plugin) {
        // case "chat":
        //     return handleChatUpdate;
        // case "piano":
        //     return handlePianoUpdate;
        // case "page":
        //     return handlePageUpdate;
        // case "chess":
        //     return handleChessUpdate;
        default:
            return () => null;  // Return null or throw error if handler for plugin is unrecognized.
    }
}


  startPresenceHeartbeat(serviceId: ServiceId) {
    const service = this.services.get(serviceId);
    if (!service) {
      console.log("Service not found", serviceId)
      return;
    }

    // Clear any existing interval to avoid multiple timers
    this.cancelPresenceHeartbeat(serviceId);

    // Call presenceHeartbeat immediately
    this.presenceHeartbeat(serviceId);

    // Set an interval to call presenceHeartbeat
    service.heartbeatIntervalId = setInterval(() => {
      this.presenceHeartbeat(serviceId);
    }, 60*1000);
  }

  // Method to stop the heartbeat timer
  cancelPresenceHeartbeat(serviceId: ServiceId) {
    const service = this.services.get(serviceId);
    if (service && service.heartbeatIntervalId) {
      clearInterval(service.heartbeatIntervalId);
      service.heartbeatIntervalId = undefined;
    }
  }

  // Your presenceHeartbeat method
  presenceHeartbeat(serviceId: ServiceId) {
    // Add your logic to send the presence heartbeat here
    let parsedServiceId = parseServiceId(serviceId);
    const request =  { "ServiceHeartbeat": { "node": parsedServiceId.node, "id": parsedServiceId.id } }
    // console.log("sending presence", serviceId);
    this.sendRequest(request);
  }

  public close() {
    if (!this.api) { return; }
    const wrapper = {
      "ClientRequest": {
        "DeleteConsumer": 0
      }
    }

    this.api.send({ data:wrapper });
  }
  sendPoke(data: any) {
    if (!this.api) { return; }
    this.api.send({ data });
  }

  sendRequest(req: any) {
    if (!this.api) { return; }
    // console.log("Sending request", req)
    const wrapper = {
      "ClientRequest": {
        "ConsumerRequest": [0, req]
      }
    }

    this.api.send({ data:wrapper });
  }

  pokeService(parsedServiceId: ParsedServiceId, data: any) {
    const request =  { "SendToService": 
      [
        { "node": parsedServiceId.node, "id": parsedServiceId.id },
        data,
      ]
    }
     this.sendRequest(request);
  }

  pokePlugin(serviceId: ServiceId, plugin: string, innerPluginRequest: any) {
    const wrap = {
      "PluginRequest": [
        plugin,
        JSON.stringify(innerPluginRequest)
      ]
    }
    let parsedServiceId = parseServiceId(serviceId);
    this.pokeService(parsedServiceId, wrap);
  }

  sendCreateServiceRequest(serviceId: ParsedServiceId, plugins: Array<String>) {
    if (!this.api) { return; }
    const wrapper = {
      "ServerRequest": {
        "CreateService": [
          { "node": serviceId.node, "id": serviceId.id },
          plugins
        ]
      }
    }

    this.api.send({ data:wrapper });
  }

  sendDeleteServiceRequest(serviceId: ParsedServiceId) {
    if (!this.api) { return; }
    const wrapper = {
      "ServerRequest": {
        "DeleteService": { "node": serviceId.node, "id": serviceId.id}
      }
    }

    this.api.send({ data:wrapper });
  }

  joinService(serviceId: ParsedServiceId) {
    const request =  { "JoinService": { "node": serviceId.node, "id": serviceId.id } }
    let rawServiceId = makeServiceId(serviceId.node, serviceId.id);
    if (this.services.has(rawServiceId)) {
      // console.log("Service already exists", rawServiceId);
      return;
    }

    this.services.set(makeServiceId(serviceId.node, serviceId.id), new_service(serviceId));
    this.onServicesChange();
    this.sendRequest(request);
    this.startPresenceHeartbeat(rawServiceId);
  }

  exitService(parsedServiceId: ParsedServiceId) {
    let serviceId = makeServiceId(parsedServiceId.node, parsedServiceId.id);
    if (!this.services.has(serviceId)) {
      console.log("Service not found", serviceId);
      return;
    }
    this.cancelPresenceHeartbeat(serviceId);
    this.services.delete(serviceId);
    this.onServicesChange();
    const request =  { "ExitService": { "node": parsedServiceId.node, "id": parsedServiceId.id } }
    this.sendRequest(request);
  }

  requestServiceList(serverNode: string) {
    const request =  { "RequestServiceList": serverNode }
    this.sendRequest(request);
  }
  requestAllInServiceList() {
    for (let serverNode of Array.from(this.availableServices.keys())) {
      this.requestServiceList(serverNode);
    }
  }
  private initialize(our, websocket_url) {
    console.log("Attempting to connect to Kinode...");
    if (!(our.node && our.process)) {
      console.log("No node or process name provided");
      return;
    } else {
      console.log("Node and process name provided", our.node, our.process, websocket_url);
    }
    const newApi = new KinodeClientApi({
      uri: websocket_url,
      nodeId: our.node,
      processId: "dartfrog:dartfrog:herobrine.os",
      onClose: (event) => {
        console.log("Disconnected from Kinode");
        this.setConnectionStatus(ConnectionStatusType.Disconnected);
        this.onClose();
      },
      onOpen: (event, api) => {
        console.log("Connected to Kinode");
        this.onOpen();
        this.setConnectionStatus(ConnectionStatusType.Connected);
      },
      onMessage: (json, api) => {
        this.setConnectionStatus(ConnectionStatusType.Connected);
        this.updateHandler(json);
      },
      onError: (event) => {
        console.log("Kinode connection error", event);
      },
    });

    this.api = newApi;
  }
}

export default DartApi;
