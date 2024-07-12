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

export enum ServiceConnectionStatusType {
  Connecting,
  Connected,
  Disconnected,
  ServiceDoesNotExist,
  Kicked,
  AccessDenied,
}

export type ServiceConnectionStatus = {
  status: ServiceConnectionStatusType,
  timestamp: number
}

interface ConstructorArgs {
  our: { node: string, process: string };
  websocket_url: string;
  onOpen?: () => void;
  onClose?: () => void;
}

class DartApi {
  private api: KinodeClientApi | null = null;
  public connectionStatus: ConnectionStatus;
  public our: { node: string, process: string };
  public websocket_url: string;

  private onOpen: () => void;
  private onClose: () => void;

  constructor({
    our,
    websocket_url,
    onOpen = () => {},
    onClose = () => {},
  }: ConstructorArgs) {
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.initialize(our, websocket_url);
  }
  private initialize(our, websocket_url) {
    // console.log("Attempting to connect to Kinode...", our, websocket_url);
    if (!(our.node && our.process)) {
      // console.log("exit", our.node, our.process)
      return;
    }
    const newApi = new KinodeClientApi({
      uri: websocket_url,
      nodeId: our.node,
      processId: our.process,
      onClose: (event) => {
        // console.log("Disconnected from Kinode");
        this.setConnectionStatus(ConnectionStatusType.Disconnected);
        this.onClose();
        // // Set a timeout to attempt reconnection
        // setTimeout(() => {
        //   this.initialize(our, websocket_url);
        // }, 5000); // Retry every 5 seconds
      },
      onOpen: (event, api) => {
        // console.log("Connected to Kinode");
        this.onOpen();
        this.setConnectionStatus(ConnectionStatusType.Connected);
        // if (this.reconnectIntervalId) {
        //   clearInterval(this.reconnectIntervalId);
        //   this.reconnectIntervalId = undefined;
        // }
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
    // if (this.connectionStatus.status !== ConnectionStatusType.Connected) {
    //   this.reconnectIntervalId = setInterval(() => {
    //     if (this.connectionStatus.status !== ConnectionStatusType.Connected) {
    //       this.initialize(our, websocket_url);
    //     }
    //   }, 5000);
    // }
  }

  private setConnectionStatus(status: ConnectionStatusType) {
    this.connectionStatus = {
      status,
      timestamp: Date.now(),
    };
  }
  public sendRequest(json:any) {
    if (!(this.api)) {
      return;
    }
    this.api.send({data:json})
  }

  public createService(name:string) {
    let req = {"Meta": {"CreateService": name}}
    this.sendRequest(req);

  }
  public requestMyServices() {
    let req = {"Meta": "RequestMyServices"}
    this.sendRequest(req);
  }

  private updateHandler(json: any) {
    console.log("got update:", json);
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
    case ServiceConnectionStatusType.AccessDenied:
      return "AccessDenied";
    default:
      return "Unknown Status";
  }
}

export type Address = string;

export interface ServiceID {
  name: string;
  address: Address;
}

export class ServiceID {
  constructor(public name: string, public address: Address) {}

  toString(): string {
    return `${this.name}:${this.address}`;
  }

  static fromString(s: string): ServiceID | null {
    const parts = s.split(':');
    if (parts.length !== 2) {
      return null;
    }
    const name = parts[0];
    const address = parts[1];
    if (!address) {
      return null;
    }
    return new ServiceID(name, address);
  }
}

export interface Service {
  id: ServiceID;
  meta: ServiceMetadata;
}

export class Service {
  constructor(public id: ServiceID, public meta: ServiceMetadata) {}

  static new(name: string, address: Address): Service {
    return new Service(new ServiceID(name, address), ServiceMetadata.new());
  }
}

export interface ServiceMetadata {
  lastSentPresence: number | null;
  subscribers: Array<string>;
  userPresence: Map<string, number>;
  access: ServiceAccess;
  visibility: ServiceVisibility;
  whitelist: Array<string>;
}

export class ServiceMetadata {
  constructor({
    lastSentPresence = null,
    subscribers = new Array<string>(),
    userPresence = new Map<string, number>(),
    access = ServiceAccess.Public,
    visibility = ServiceVisibility.Visible,
    whitelist = new Array<string>()
  }: {
    lastSentPresence?: number | null,
    subscribers?: Array<string>,
    userPresence?: Map<string, number>,
    access?: ServiceAccess,
    visibility?: ServiceVisibility,
    whitelist?: Array<string>
  }) {
    this.lastSentPresence = lastSentPresence;
    this.subscribers = subscribers;
    this.userPresence = userPresence;
    this.access = access;
    this.visibility = visibility;
    this.whitelist = whitelist;
  }

  static new(): ServiceMetadata {
    return new ServiceMetadata({});
  }
}

export enum ServiceAccess {
  Public = "Public",
  Whitelist = "Whitelist",
  HostOnly = "HostOnly",
}

export enum ServiceVisibility {
  Visible = "Visible",
  HostOnly = "HostOnly",
  Hidden = "Hidden",
}

export default DartApi;