import KinodeClientApi from "@kinode/client-api";
import { SERVER_NODE, WEBSOCKET_URL } from '../utils';
import { deflate } from "zlib";
import { on } from "events";
import  {ChatState, handleChatUpdate}  from "./chat"; // Import the ChatState type from the appropriate module
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
  chatState: ChatState,
}
export interface Presence {
  time: number;
}

export interface ServiceMetadata {
  subscribers: Array<string>;
  user_presence: { [key: string]: Presence };
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
  // let rawServiceId = makeServiceId(serviceId.node, serviceId.id);
  // let chat = new ChatObject({
  //   serviceId: rawServiceId,
  //   messageSender: ()=>{}
  // });
  return {
    serviceId: serviceId,
    metadata: {subscribers: [], user_presence: {}},
    connectionStatus: {status:ServiceConnectionStatusType.Connecting, timestamp:Date.now()},
    chatState: {messages: new Map()}
  }
}

interface ConstructorArgs {
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

  private onOpen: () => void;
  private onClose: () => void;
  private onServicesChangeHook: (services: Services) => void = () => {};
  private onAvailableServicesChangeHook: (availableServices: AvailableServices) => void = () => {};

  constructor({
    serviceUpdateHandlers = new Map(),
    onOpen = () => {},
    onClose = () => {},
    onServicesChangeHook = (services) => {},
    onAvailableServicesChangeHook = (availableServices) => {},
  }: ConstructorArgs = {}) {
    this.serviceUpdateHandlers = serviceUpdateHandlers;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onServicesChangeHook = onServicesChangeHook;
    this.onAvailableServicesChangeHook = onAvailableServicesChangeHook;
    this.setConnectionStatus(ConnectionStatusType.Connecting);
    this.initialize();
  }
  private onServicesChange: () => void = () => {  
    this.onServicesChangeHook(this.services);
  }
  private onAvailableServicesChange: () => void = () => {  
    this.onAvailableServicesChangeHook(this.availableServices);
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
        
        service.connectionStatus = {status:ServiceConnectionStatusType.Connected, timestamp:Date.now()};
        if (response === "SubscribeAck") {
          this.services.set(serviceId, service);
          this.onServicesChange();
        } else if (response.ServiceMetadata) {
          service.metadata = response.ServiceMetadata;
          this.services.set(serviceId, service);
          // console.log("new ServiceMetadata:", response.ServiceMetadata);
          this.onServicesChange();
        } else if (response.ChatUpdate) {
          // console.log('ChatUpdate:', response.ChatUpdate, service.chatState);
          let newChatState = handleChatUpdate(service.chatState, response.ChatUpdate);
          service.chatState = newChatState;
          this.services.set(serviceId, service);
          this.onServicesChange();
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
    // console.log("Sending request", req)
    const wrapper = {
      "ClientRequest": {
        "ConsumerRequest": [0, req]
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

  private initialize() {
    console.log("Attempting to connect to Kinode...");
    if (!(window.our?.node && window.our?.process)) {
      return;
    }
    const newApi = new KinodeClientApi({
      uri: WEBSOCKET_URL,
      nodeId: window.our.node,
      processId: window.our.process,
      onClose: (event) => {
        console.log("Disconnected from Kinode");
        this.setConnectionStatus(ConnectionStatusType.Disconnected);
        this.onClose();
      },
      onOpen: (event, api) => {
        console.log("Connected to Kinode");
        this.onOpen();
        this.setConnectionStatus(ConnectionStatusType.Connected);
        this.joinService({node:SERVER_NODE, id:"chat-1"});
        this.requestServiceList(SERVER_NODE);
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
