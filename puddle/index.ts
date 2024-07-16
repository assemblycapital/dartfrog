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
  onOpen?: (api) => void;
  onClose?: () => void;
  serviceId?: string;
}

export class ServiceApi {
  private api: KinodeClientApi | null = null;
  public connectionStatus: ConnectionStatus;
  public our: { node: string, process: string };
  public websocket_url: string;
  public serviceId: string | null;

  private onOpen: (api) => void;
  private onClose: () => void;

  constructor({
    our,
    websocket_url,
    onOpen = (api) => {},
    onClose = () => {},
    serviceId = null,
  }: ConstructorArgs) {
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.serviceId = serviceId;
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
        console.log("Connected to Kinode");
        this.onOpen(this);
        if (this.serviceId) {
          this.setService(this.serviceId);
        }

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

  public setService(fullServiceId:string) {
    let req = {"Meta": {"SetService": fullServiceId}}
    this.sendRequest(req);
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

export type PeerMap = Map<string, Peer>;

export type Address = string;

export interface ServiceID {
  name: string;
  address: Address;
}

export class ServiceID {
  constructor(public name: string, public address: Address) {}

  toShortString(): string {
    let [node, process] = this.address.split("@")
    const res = `${this.name}:${node}`;
    return res;
  }

  toString(): string {
    const res = `${this.name}:${this.address}`;
    return res;
  }

  hostNode(): string {
    let [node, process] = this.address.split("@")
    return node;
  }
  process(): string {
    let [node, process] = this.address.split("@")
    return process;
  }

  static fromString(s: string): ServiceID | null {
    const parts = s.split(':');
    if (parts.length < 2) {
      return null;
    }
    const name = parts[0];
    const address = parts.slice(1).join(':'); // Join parts 1 to n by ':'
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
  last_sent_presence: number | null;
  subscribers: Array<string>;
  user_presence: Map<string, number>;
  access: ServiceAccess;
  visibility: ServiceVisibility;
  whitelist: Array<string>;
}

export class ServiceMetadata {
  constructor({
    last_sent_presence = null,
    subscribers = new Array<string>(),
    user_presence = new Map<string, number>(),
    access = ServiceAccess.Public,
    visibility = ServiceVisibility.Visible,
    whitelist = new Array<string>()
  }: {
    last_sent_presence?: number | null,
    subscribers?: Array<string>,
    user_presence?: Map<string, number>,
    access?: ServiceAccess,
    visibility?: ServiceVisibility,
    whitelist?: Array<string>
  }) {
    this.last_sent_presence = last_sent_presence;
    this.subscribers = subscribers;
    this.user_presence = user_presence;
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

export interface JsonService {
  id: {
    name: string;
    address: string;
  };
  meta: {
    last_sent_presence: number | null;
    subscribers: Array<string>;
    user_presence: { [key: string]: number };
    access: ServiceAccess;
    visibility: ServiceVisibility;
    whitelist: Array<string>;
  };
}

export function serviceFromJson(jsonService: JsonService): Service {
  return {
    id: new ServiceID(jsonService.id.name, jsonService.id.address),
    meta: new ServiceMetadata({
      last_sent_presence: jsonService.meta.last_sent_presence,
      subscribers: jsonService.meta.subscribers,
      user_presence: new Map(Object.entries(jsonService.meta.user_presence)),
      access: jsonService.meta.access,
      visibility: jsonService.meta.visibility,
      whitelist: jsonService.meta.whitelist,
    })
  };
}

export enum PeerActivity {
  Offline = "Offline",
  Private = "Private",
  Online = "Online",
  RecentlyOnline = "RecentlyOnline",
}

export type PeerActivityType = 
  | { type: PeerActivity.Offline }
  | { type: PeerActivity.Private }
  | { type: PeerActivity.Online, timestamp: number }
  | { type: PeerActivity.RecentlyOnline, timestamp: number };

export enum ActivitySetting {
  Public = "Public",
  Private = "Private",
}

export enum NameColor {
  Red = "Red",
  Blue = "Blue",
  Green = "Green",
  Orange = "Orange",
  Purple = "Purple",
}

export interface Profile {
  bio: string;
  nameColor: NameColor;
  pfp?: string; // url
}

export class Profile {
  constructor(public bio: string, public nameColor: NameColor, public pfp?: string) {}

  static new(node: string): Profile {
    return new Profile("", NameColor.Blue, undefined);
  }
}

export interface Peer {
  node: string;
  hostedServices: Service[];
  profile: Profile;
  activity: PeerActivityType;
  outstandingRequest: boolean;
  lastUpdated?: number;
}

export class Peer {
  constructor(
    public node: string,
    public hostedServices: Service[],
    public profile: Profile,
    public activity: PeerActivityType,
    public outstandingRequest: boolean,
    public lastUpdated?: number
  ) {}

  static new(node: string): Peer {
    return new Peer(
      node,
      [],
      Profile.new(node),
      { type: PeerActivity.Offline },
      false,
      undefined
    );
  }
}

export function peerFromJson(json: any): Peer {
  const hostedServices = json.hosted_services.map((service: any) => serviceFromJson(service));
  const profile = new Profile(
    json.profile.bio,
    json.profile.nameColor,
    json.profile.pfp
  );

  let activity: PeerActivityType;
  switch (json.activity.type) {
    case PeerActivity.Offline:
      activity = { type: PeerActivity.Offline };
      break;
    case PeerActivity.Private:
      activity = { type: PeerActivity.Private };
      break;
    case PeerActivity.Online:
      activity = { type: PeerActivity.Online, timestamp: json.activity.timestamp };
      break;
    case PeerActivity.RecentlyOnline:
      activity = { type: PeerActivity.RecentlyOnline, timestamp: json.activity.timestamp };
      break;
    default:
      throw new Error("Unknown activity type");
  }

  return new Peer(
    json.node,
    hostedServices,
    profile,
    activity,
    json.outstanding_request,
    json.last_updated
  );
}
