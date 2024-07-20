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

export class ServiceConnectionStatus {
  constructor(
    public status: ServiceConnectionStatusType,
    public timestamp: number
  ) {}

  toString(): string {
    switch (this.status) {
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
}

export enum ServiceConnectionStatusType {
  Connecting,
  Connected,
  Disconnected,
  ServiceDoesNotExist,
  Kicked,
  AccessDenied,
}

interface ConstructorArgs {
  our: { node: string, process: string };
  websocket_url: string;
  onOpen?: (api) => void;
  onClose?: () => void;
  serviceId?: string;
  onServiceConnectionStatusChange?: (api) => void;
  onServiceMetadataChange?: (api) => void;
  onServiceMessage?: (message: any) => void;
  onClientMessage?: (message: any) => void;
}

export class ServiceApi {
  private api: KinodeClientApi | null = null;
  public connectionStatus: ConnectionStatus;
  public our: { node: string, process: string };
  public websocket_url: string;

  public serviceId: string | null;
  public serviceMetadata: ServiceMetadata | null;
  public serviceConnectionStatus: ServiceConnectionStatus | null;

  private onOpen: (api) => void;
  private onClose: () => void;
  private onServiceConnectionStatusChange: (api) => void;
  private onServiceMetadataChange: (api) => void;
  private onServiceMessage: (message: any) => void;
  private onClientMessage: (message: any) => void;

  constructor({
    our,
    websocket_url,
    onOpen = (api) => {},
    onClose = () => {},
    serviceId = null,
    onServiceConnectionStatusChange = (api) => {},
    onServiceMetadataChange = (api) => {},
    onServiceMessage = (message) => {},
    onClientMessage = (message) => {},
  }: ConstructorArgs) {
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.serviceId = serviceId;
    this.onServiceConnectionStatusChange = onServiceConnectionStatusChange;
    this.onServiceMetadataChange = onServiceMetadataChange;
    this.onServiceMessage = onServiceMessage;
    this.onClientMessage = onClientMessage;
    this.initialize(our, websocket_url);
  }
  private initialize(our, websocket_url) {
    // console.log("Attempting to connect to Kinode...", our, websocket_url);
    if (!(our.node && our.process)) {
      // console.log("exit", our.node, our.process)
      return;
    }
    this.serviceMetadata = null;
    this.serviceConnectionStatus = null;

    const newApi = new KinodeClientApi({
      uri: websocket_url,
      nodeId: our.node,
      processId: our.process,
      onClose: (event) => {
        this.setConnectionStatus(ConnectionStatusType.Disconnected);
        this.onClose();
      },
      onOpen: (event, api) => {
        console.log("Connected to Kinode");
        this.onOpen(this);
        if (this.serviceId) {
          this.setServiceConnectionStatus(ServiceConnectionStatusType.Connecting);
          this.onServiceConnectionStatusChange(this);
          this.setService(this.serviceId);
        }

        setInterval(() => {
          this.sendHeartbeat();
        }, 60*1000);

        this.setConnectionStatus(ConnectionStatusType.Connected);
      },
      onMessage: (json, api) => {
        this.updateHandler(json);
      },
      onError: (event) => {
        console.log("Kinode connection error", event);
      },
    });

    this.api = newApi;
  }

  private setConnectionStatus(status: ConnectionStatusType) {
    this.connectionStatus = {
      status,
      timestamp: Date.now(),
    };
  }

  private setServiceConnectionStatus(status: ServiceConnectionStatusType) {
    this.serviceConnectionStatus = new ServiceConnectionStatus(status, Date.now());
    this.onServiceConnectionStatusChange(this);
  }

  public sendRequest(json:any) {
    if (!(this.api)) {
      return;
    }
    this.api.send({data:json})
  }

  public sendToService(data:any) {
    let req = {"Channel":
                {"MessageServer":
                  JSON.stringify(data)
                }
              };
    this.sendRequest(req);
  }

  public sendHeartbeat() {
    let req = {"Channel": "Heartbeat"};
    this.sendRequest(req);
  }

  public unsubscribeService() {
    let req = {"Meta": "Unsubscribe"}
    this.sendRequest(req);
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

  private updateHandler(jsonString: any) {
    const data = JSON.parse(jsonString)

    if (data["Meta"]) {
      const metaUpd = data["Meta"]
      // TODO
    } else if (data["Channel"]) {
      const channelUpd = data["Channel"]
      if (channelUpd === "SubscribeAck") {
        this.setServiceConnectionStatus(ServiceConnectionStatusType.Connected);
      } else if (channelUpd["SubscribeNack"]) {
        const nack = channelUpd["SubscribeNack"]
        if (nack === "ServiceDoesNotExist") {
          this.setServiceConnectionStatus(ServiceConnectionStatusType.ServiceDoesNotExist);
        } else if (nack === "AccessDenied") {
          this.setServiceConnectionStatus(ServiceConnectionStatusType.AccessDenied);
        }
      } else if (channelUpd["Metadata"]) {
        this.setServiceConnectionStatus(ServiceConnectionStatusType.Connected);
        const meta = channelUpd["Metadata"]
        const parsedMeta = serviceMetadataFromJson(meta);
        this.serviceMetadata = parsedMeta;
        this.onServiceMetadataChange(this);
      } else if (channelUpd["FromClient"]) {
        const msg = JSON.parse(channelUpd["FromClient"])
        this.onClientMessage(msg)
      } else if (channelUpd["FromServer"]) {
        const msg = JSON.parse(channelUpd["FromServer"])
        this.onServiceMessage(msg)
      } 

    }
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
    meta: serviceMetadataFromJson(jsonService.meta)
  };
}

export function serviceMetadataFromJson(jsonMeta: JsonService['meta']): ServiceMetadata {
  return new ServiceMetadata({
    last_sent_presence: jsonMeta.last_sent_presence,
    subscribers: jsonMeta.subscribers,
    user_presence: new Map(Object.entries(jsonMeta.user_presence)),
    access: jsonMeta.access,
    visibility: jsonMeta.visibility,
    whitelist: jsonMeta.whitelist,
  });
}

export enum PeerActivityType {
  Offline = "Offline",
  Private = "Private",
  Online = "Online",
  RecentlyOnline = "RecentlyOnline",
}

export type PeerActivity = 
  | { type: PeerActivityType.Private }
  | { type: PeerActivityType.Online, timestamp: number }
  | { type: PeerActivityType.Offline, timestamp: number }

export function activityFromJson(jsonActivity: any): PeerActivity {
  if (jsonActivity.Online !== undefined) {
    return { type: PeerActivityType.Online, timestamp: jsonActivity.Online };
  } else if (jsonActivity.Offline !== undefined) {
    return { type: PeerActivityType.Offline, timestamp: jsonActivity.Offline };
  } else if (jsonActivity === 'Private') {
    return { type: PeerActivityType.Private };
  } else {
    throw new Error("Unknown activity type");
  }
}

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
  Default = "Default",
}

export interface Profile {
  bio: string;
  nameColor: NameColor;
  pfp?: string; // url
}

export function profileFromJson(jsonProfile: any): Profile {
  return new Profile(
    jsonProfile.bio,
    jsonProfile.name_color,
    jsonProfile.pfp
  );
}

export class Profile {
  constructor(public bio: string, public nameColor: NameColor, public pfp?: string) {}

  static new(node: string): Profile {
    return new Profile("", NameColor.Blue, undefined);
  }
}

export interface PeerData {
  hostedServices: Service[];
  profile: Profile;
  activity: PeerActivity;
}

export class Peer {
  constructor(
    public node: string,
    public peerData: PeerData | null = null,
    public outstandingRequest: number | null = null,
    public lastUpdated: number | null = null
  ) {}

  static new(node: string): Peer {
    return new Peer(
      node,
      null, // Initialize peerData as null
      null, // Initialize outstandingRequest as null
      null  // Initialize lastUpdated as null
    );
  }
}

export function peerFromJson(json: any): Peer {
  const peerData: PeerData | null = json.peer_data ? {
    hostedServices: json.peer_data.hosted_services.map((service: any) => serviceFromJson(service)),
    profile: profileFromJson(json.peer_data.profile),
    activity: activityFromJson(json.peer_data.activity)  // Use activityFromJson here
  } : null;

  return new Peer(
    json.node,
    peerData,
    json.outstanding_request || null,
    json.last_updated || null
  );
}

export const dfLinkRegex = /^df:\/\/([a-zA-Z0-9\-]+):([a-zA-Z0-9\-]+\.[a-zA-Z0-9\-]+)@([a-zA-Z0-9\-]+):([a-zA-Z0-9\-]+):([a-zA-Z0-9\-]+\.[a-zA-Z0-9\-]+)$/;

export function dfLinkToRealLink(dfLink: string, baseOrigin:string) {
  return `http://${baseOrigin}/dartfrog:dartfrog:herobrine.os/join/${dfLink.slice(5)}`
}


export const DEFAULT_PFP = 'https://bwyl.nyc3.digitaloceanspaces.com/kinode/dartfrog/dartfrog256_small_nobg.png'
export function getPeerPfp(peer: Peer): string {
  if (peer.peerData && peer.peerData.profile.pfp) {
    return peer.peerData.profile.pfp
  }
  return DEFAULT_PFP;
}
export function getPeerNameColor(peer: Peer): string {
  if (peer.peerData) {
    return getClassForNameColor(peer.peerData.profile.nameColor)
  }
  return 'name-color-default';
}
export function getClassForNameColor(nameColor: NameColor): string {
  switch (nameColor) {
    case NameColor.Red:
      return 'name-color-red';
    case NameColor.Blue:
      return 'name-color-blue';
    case NameColor.Green:
      return 'name-color-green';
    case NameColor.Orange:
      return 'name-color-orange';
    case NameColor.Purple:
      return 'name-color-purple';
    default:
      return 'name-color-default';
  }
}


export function getServiceRecencyText(service: Service) {
  const now = new Date();
  if (!(service.meta.last_sent_presence)) {
    return "new"
  }
  const time = service.meta.last_sent_presence
  const diff = now.getTime() - time*1000;

  // if less than 5min, say now
  // if less than 1h, say x min ago
  // if less than 1d, say x hr ago
  // else say x days ago
  if (service.meta.subscribers.length > 0) {
    return `now`;
  }
  return getRecencyText(diff);
}

export function getRecencyText(diff:number) {
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
  if (diff > 7307200000) {
    const years = Math.floor(diff / 31536000000);
    const months = Math.floor((diff % 31536000000) / 2592000000);
    return `${years} yrs ${months} months ago`;
  }
  return `${Math.floor(diff / 86400000)} days ago`;
}

export function getAllServicesFromPeerMap(peerMap: PeerMap): Service[] {
  const allServices: Service[] = [];
  
  peerMap.forEach(peer => {
    if (peer.peerData && peer.peerData.hostedServices) {
      allServices.push(...peer.peerData.hostedServices);
    }
  });

  return allServices;
}

export function sortServices(services) {
  return services.sort((a, b) => {
    const subDiff = b.meta.subscribers.length - a.meta.subscribers.length;
    if (subDiff !== 0) return subDiff;

    const aMaxTime = a.meta.last_sent_presence ?? 0;
    const bMaxTime = b.meta.last_sent_presence ?? 0;

    return bMaxTime - aMaxTime;
  });
}

export const getUniqueServices = (services) => {
  return Array.from(new Set(services.map(service => service.id.toString())))
    .map(id => services.find(service => service.id.toString() === id));
};

