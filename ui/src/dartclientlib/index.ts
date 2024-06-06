import KinodeClientApi from "@kinode/client-api";
import { SERVER_NODE, WEBSOCKET_URL } from '../utils';
import { deflate } from "zlib";
import { on } from "events";

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
  heartbeatIntervalId?: NodeJS.Timeout
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
  return `${node}:${id}`;
}
export const parseServiceId = (serviceId: string) => {
  const [node, id] = serviceId.split(':');
  return { node, id };
}


function new_service(serviceId: ParsedServiceId) : Service {
  return {
    serviceId: serviceId,
    metadata: {subscribers: [], user_presence: {}},
    connectionStatus: {status:ServiceConnectionStatusType.Connecting, timestamp:Date.now()}
  }
}
interface ConstructorArgs {
  serviceUpdateHandlers?: ServiceUpdateHandlers;
  onOpen?: () => void;
  onClose?: () => void;
  onServicesChange?: (services: Services) => void;
}

class DartApi {
  private api: KinodeClientApi | null = null;
  public connectionStatus: ConnectionStatus;
  private serviceUpdateHandlers: ServiceUpdateHandlers;
  private services: Map<ServiceId, Service> = new Map();

  private onOpen: () => void;
  private onClose: () => void;
  private onServicesChange: (services: Services) => void;

  constructor({
    serviceUpdateHandlers = new Map(),
    onOpen = () => {},
    onClose = () => {},
    onServicesChange = (services) => {},
  }: ConstructorArgs = {}) {
    this.serviceUpdateHandlers = serviceUpdateHandlers;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onServicesChange = onServicesChange;
    this.setConnectionStatus(ConnectionStatusType.Connecting);
    this.initialize();
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
          console.log('Server Address:', address);
          console.log('Server Response:', response);

          if (response.NoSuchService) {
              console.log('No such service:', response.NoSuchService);
              // Add your logic to handle the NoSuchService response here
              let serviceId : ServiceId = makeServiceId(address, response.NoSuchService);
              let service = this.services.get(serviceId);
              if (!service) { return; }
              service.connectionStatus = {status:ServiceConnectionStatusType.ServiceDoesNotExist, timestamp:Date.now()};
              this.services.set(serviceId, service);
              this.onServicesChange(this.services);

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
          this.onServicesChange(this.services);
          this.startPresenceHeartbeat(serviceId);
        } else if (response.ServiceMetadata) {
          service.metadata = response.ServiceMetadata;
          this.startPresenceHeartbeat(serviceId);
          this.onServicesChange(this.services);
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
    }, 1*60*1000);
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
    console.log("sending presence", serviceId);
    this.sendRequest(request);
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

    this.api.send({ data:wrapper });
  }

  joinService(serviceId: ParsedServiceId) {
    const request =  { "JoinService": { "node": serviceId.node, "id": serviceId.id } }
    this.services.set(makeServiceId(serviceId.node, serviceId.id), new_service(serviceId));
    this.onServicesChange(this.services);
    this.sendRequest(request);
  }
  exitService(serviceId: ParsedServiceId) {
    const request =  { "ExitService": { "node": serviceId.node, "id": serviceId.id } }
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
        this.joinService({node:SERVER_NODE, id:"chat"});
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
