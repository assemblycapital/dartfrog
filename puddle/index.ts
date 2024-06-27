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

export type PluginUpdateSource = "client" | "service";
export type PluginUpdateHandler = (json: string | Blob, service: Service, source: PluginUpdateSource) => void;

export type PluginUpdateHandlers = Map<PluginId, PluginUpdateHandler>;

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
export type PluginId = string;

export type Service = {
  serviceId: ParsedServiceId,
  connectionStatus: ServiceConnectionStatus,
  metadata: ServiceMetadata,
  heartbeatIntervalId?: NodeJS.Timeout,
}
export interface Presence {
  time: number;
}

export interface ServiceMetadata {
  subscribers: Array<string>;
  user_presence: { [key: string]: Presence };
  plugins: Array<string>;
  last_sent_presence: number;
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

export type PerNodeAvailableServices = Map<string, AvailableServices>  // node, available services
export type AvailableServices = Map<string, ServiceMetadata> // serviceId, metadata

function new_service(serviceId: ParsedServiceId) : Service {
  return {
    serviceId: serviceId,
    metadata: {subscribers: [], user_presence: {}, plugins: [], last_sent_presence: 0},
    connectionStatus: {status:ServiceConnectionStatusType.Connecting, timestamp:Date.now()},
  }
}

interface ConstructorArgs {
  our: { node: string, process: string };
  websocket_url: string;
  pluginUpdateHandlers?: PluginUpdateHandlers;
  pluginUpdateHandler?: {plugin: string, serviceId: ServiceId, handler: PluginUpdateHandler}
  onOpen?: () => void;
  onClose?: () => void;
  onServicesChangeHook?: (services: Services) => void;
  onAvailableServicesChangeHook?: (availableServices: PerNodeAvailableServices) => void;
}

class DartApi {
  private api: KinodeClientApi | null = null;
  public connectionStatus: ConnectionStatus;
  private pluginUpdateHandlers: PluginUpdateHandlers;
  private services: Map<ServiceId, Service> = new Map();
  private availableServices: PerNodeAvailableServices = new Map();
  public our: { node: string, process: string };
  public websocket_url: string;

  private onOpen: () => void;
  private onClose: () => void;
  private onServicesChangeHook: (services: Services) => void = () => {};
  private onAvailableServicesChangeHook: (availableServices: PerNodeAvailableServices) => void = () => {};
  private reconnectIntervalId?: NodeJS.Timeout;

  constructor({
    our,
    websocket_url,
    pluginUpdateHandlers = new Map(),
    pluginUpdateHandler,
    onOpen = () => {},
    onClose = () => {},
    onServicesChangeHook = (services) => {},
    onAvailableServicesChangeHook = (availableServices) => {},
  }: ConstructorArgs) {
    this.pluginUpdateHandlers = pluginUpdateHandlers;
    if (pluginUpdateHandler) {
      this.registerPluginUpdateHandler(pluginUpdateHandler.serviceId, pluginUpdateHandler.plugin, pluginUpdateHandler.handler);
    }
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onServicesChangeHook = onServicesChangeHook;
    this.onAvailableServicesChangeHook = onAvailableServicesChangeHook;
    this.setConnectionStatus(ConnectionStatusType.Connecting);
    this.initialize(our, websocket_url);
    this.onAvailableServicesChange();
  }
  private onServicesChange: () => void = () => {  
    this.onServicesChangeHook(this.services);
  }
  private onAvailableServicesChange: () => void = () => {  
    this.onAvailableServicesChangeHook(this.availableServices);
  }

  public make_plugin_id(serviceId: ServiceId, plugin: string) {
    return `${plugin}.${serviceId}`;
  }
  public registerPluginUpdateHandler(serviceId: ServiceId, plugin: string, handler: PluginUpdateHandler) {
    let pluginId = this.make_plugin_id(serviceId, plugin);
    this.pluginUpdateHandlers.set(pluginId, handler);
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
              // for (let serviceId of Array.from(response.ServiceList.keys())) {

              // }
              let newServices = new Map()
              // console.log(response.ServiceList)
              let serviceIds = Object.keys(response.ServiceList);
              for (let serviceId of serviceIds) {
                newServices.set(serviceId, response.ServiceList[serviceId]);
              }
              // for (let serviceId of Array.from(response.ServiceList.keys())) {
              //   newServices.set(serviceId, response.ServiceList.get(serviceId));
              // }
              this.availableServices.set(address, newServices);
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
        
        service.connectionStatus = {status:ServiceConnectionStatusType.Connected, timestamp:Date.now()};
        if (response === "SubscribeAck") {
          this.services.set(serviceId, service);
          this.onServicesChange();
        } else if (response.ServiceMetadata) {
          service.metadata = response.ServiceMetadata;
          this.services.set(serviceId, service);
          for (let user of Object.keys(response.ServiceMetadata.user_presence)) {
            if (!this.availableServices.has(user)) {
              this.requestServiceList(user);
              this.onAvailableServicesChange();
            }
          }
          this.onServicesChange();
        } else if (response === 'ServiceDeleted') {
          service.connectionStatus = {status:ServiceConnectionStatusType.Kicked, timestamp:Date.now()};
          this.cancelPresenceHeartbeat(serviceId);
          // TODO?
          // this.services.delete(serviceId);
          this.onServicesChange();
        } else if (response === 'Kick') {
          console.log("Kicked", serviceId);
          service.connectionStatus = {status:ServiceConnectionStatusType.Kicked, timestamp:Date.now()};
          this.cancelPresenceHeartbeat(serviceId);
          // TODO?
          // this.services.delete(serviceId);
          this.onServicesChange();
        } else if (response.MessageFromPluginClient) {
          const [plugin_name, update] = response.MessageFromPluginClient;
          // call pluginUpdateHandler if it exists
          let pluginId = this.make_plugin_id(serviceId, plugin_name);
          const pluginUpdateHandler = this.pluginUpdateHandlers.get(pluginId);
          if (pluginUpdateHandler) {
              let parsedUpdate = JSON.parse(update);
              pluginUpdateHandler(parsedUpdate, service, "client");
          } else {
            // console.warn("no plugin update handler for", pluginId);
          }
        } else if (response.MessageFromPluginServiceToFrontend) {
          const [plugin_name, update] = response.MessageFromPluginServiceToFrontend;
          // call pluginUpdateHandler if it exists
          let pluginId = this.make_plugin_id(serviceId, plugin_name);
          const pluginUpdateHandler = this.pluginUpdateHandlers.get(pluginId);
          if (pluginUpdateHandler) {
              let parsedUpdate = JSON.parse(update);
              pluginUpdateHandler(parsedUpdate, service, "service");
          } else {
          }
        } else {
          console.warn('Unknown service message format:', message);
        }
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
    const wrapper = {
      "ClientRequest": {
        "ConsumerRequest": [0, req]
      }
    }

    try {
      this.api.send({ data:wrapper });
    } catch (error) {
      console.error('Failed to send request:', error);
    }
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

  pokePluginService(serviceId: ServiceId, plugin: string, innerPluginRequest: any) {
    const wrap = {
      "PluginRequest": [
        plugin,
        JSON.stringify(innerPluginRequest)
      ]
    }
    let parsedServiceId = parseServiceId(serviceId);
    this.pokeService(parsedServiceId, wrap);
  }

  pokePluginClient(serviceId: ServiceId, plugin: string, innerPluginRequest: any) {
    let parsedServiceId = parseServiceId(serviceId);
    const request =  { "SendToPluginClient": 
      [
        { "node": parsedServiceId.node, "id": parsedServiceId.id },
        plugin,
        JSON.stringify(innerPluginRequest)
      ]
    }
    this.sendRequest(request);
  }

  sendCreateServiceRequest(serviceId: ParsedServiceId, plugins: Array<String>) {
    if (!this.api) { return; }
    // console.log("Sending create service request", serviceId, plugins)
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

  public joinService(serviceId: ServiceId) {
    let parsedServiceId = parseServiceId(serviceId);
    this._joinService(parsedServiceId);
  }
  public _joinService(serviceId: ParsedServiceId) {
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

  public exitService(serviceId: ServiceId) {
    let parsedServiceId = parseServiceId(serviceId);
    this._exitService(parsedServiceId);
  }
  public _exitService(parsedServiceId: ParsedServiceId) {
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
    // console.log("Attempting to connect to Kinode...");
    if (!(our.node && our.process)) {
      return;
    }
    const newApi = new KinodeClientApi({
      uri: websocket_url,
      nodeId: our.node,
      processId: "dartfrog:dartfrog:herobrine.os",
      onClose: (event) => {
        console.log("Disconnected from Kinode");
        this.setConnectionStatus(ConnectionStatusType.Disconnected);
        this.onClose();
        // Set a timeout to attempt reconnection
        setTimeout(() => {
          this.initialize(our, websocket_url);
        }, 5000); // Retry every 5 seconds
      },
      onOpen: (event, api) => {
        // console.log("Connected to Kinode");
        this.onOpen();
        this.setConnectionStatus(ConnectionStatusType.Connected);
        if (this.reconnectIntervalId) {
          clearInterval(this.reconnectIntervalId);
          this.reconnectIntervalId = undefined;
        }
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
    if (this.connectionStatus.status !== ConnectionStatusType.Connected) {
      this.reconnectIntervalId = setInterval(() => {
        if (this.connectionStatus.status !== ConnectionStatusType.Connected) {
          this.initialize(our, websocket_url);
        }
      }, 5000);
    }
  }
}

export function stringifyServiceConnectionStatus(status: ServiceConnectionStatusType): string {
  switch (status) {
    case ServiceConnectionStatusType.Connecting:
      return "Connecting";
    case ServiceConnectionStatusType.Connected:
      return "Connected";
    case ServiceConnectionStatusType.Disconnected:
      return "Disconnected";
    case ServiceConnectionStatusType.ServiceDoesNotExist:
      return "ServiceDoesNotExist";
    case ServiceConnectionStatusType.Kicked:
      return "Kicked";
    default:
      return "Unknown Status";
  }
}
export default DartApi;
