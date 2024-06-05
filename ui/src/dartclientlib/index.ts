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

export type ServiceId = {
  node: string,
  id: string
}

export type Service = {
  serviceId: ServiceId,
  connectionStatus: ServiceConnectionStatus,
}

export type Services = Map<ServiceId, Service>;

function new_service(serviceId: ServiceId) {
  return {
    serviceId: serviceId,
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
    
    console.log('got json', json);

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
    } else {
        console.warn('Unknown message format:', parsedJson);
    }
}

private handleClientUpdate(message: any) {
    if (message.Todo) {
        console.log('Client TODO:', message.Todo);
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
            let serviceId : ServiceId = {node:address, id:response.NoSuchService};
            let service = this.services.get(serviceId);
            console.log('serviceId:', serviceId)
            console.log('service:', service)
            console.log('services:', this.services)
            if (!service) { return; }
            service.connectionStatus = {status:ServiceConnectionStatusType.ServiceDoesNotExist, timestamp:Date.now()};
            this.services.set(serviceId, service);
            console.log('calling onservicechange')
            this.onServicesChange(this.services);

        } else {
            console.warn('Unknown server response:', response);
        }
    } else {
        console.warn('Unknown server message format:', message);
    }
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

  joinService(serviceId: ServiceId) {
    const request =  { "JoinService": { "node": serviceId.node, "id": serviceId.id } }
    this.services.set(serviceId, new_service(serviceId));
    this.onServicesChange(this.services);
    this.sendRequest(request);
  }
  exitService(serviceId: ServiceId) {
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
