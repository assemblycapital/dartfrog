import KinodeClientApi from "@kinode/client-api";
// export * from './utils';

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
      case ServiceConnectionStatusType.ServiceDeleted:
        return "ServiceDeleted";
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
  ServiceDeleted,
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
  onFullServiceMetadataChange?: (api) => void;
  onServiceMessage?: (message: any) => void;
  onClientMessage?: (message: any) => void;
  onProcessMessage?: (message: any) => void;
  onPeerMapChange?: (api) => void;
  onLocalServicesChange?: (api) => void;
  disableAutoReconnect?: boolean;
}

export class ServiceApi {
  private api: KinodeClientApi | null = null;
  public connectionStatus: ConnectionStatus;
  public our: { node: string, process: string };
  public websocket_url: string;

  public serviceId: string | null;
  public serviceMetadata: PublicServiceMetadata | null;
  public fullServiceMetadata: ServiceMetadata | null;
  public serviceConnectionStatus: ServiceConnectionStatus | null;
  public peerMap: PeerMap = new Map();
  public localServices = [];

  private onOpen: (api) => void;
  private onClose: () => void;
  private onServiceConnectionStatusChange: (api) => void;
  private onServiceMetadataChange: (api) => void;
  private onFullServiceMetadataChange: (api) => void;
  private onServiceMessage: (message: any) => void;
  private onClientMessage: (message: any) => void;
  private onProcessMessage: (message: any) => void;
  private onPeerMapChange: (api) => void;
  private onLocalServicesChange: (api) => void;
  private autoReconnectEnabled = true;
  private reconnectInterval = null;
  private reconnectAttempts = 0;

  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor({
    our,
    websocket_url,
    onOpen = (api) => {},
    onClose = () => {},
    serviceId = null,
    onServiceConnectionStatusChange = (api) => {},
    onServiceMetadataChange = (api) => {},
    onFullServiceMetadataChange = (api) => {},
    onServiceMessage = (message) => {},
    onClientMessage = (message) => {},
    onProcessMessage = (message) => {},
    onPeerMapChange = (api) => {},
    onLocalServicesChange = (api) => {},
    disableAutoReconnect = false,
  }: ConstructorArgs) {
    this.our = our;
    this.websocket_url = websocket_url;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.serviceId = serviceId;
    this.onServiceConnectionStatusChange = onServiceConnectionStatusChange;
    this.onServiceMetadataChange = onServiceMetadataChange;
    this.onFullServiceMetadataChange = onFullServiceMetadataChange;
    this.onServiceMessage = onServiceMessage;
    this.onClientMessage = onClientMessage;
    this.onProcessMessage = onProcessMessage;
    this.onPeerMapChange = onPeerMapChange;
    this.onLocalServicesChange = onLocalServicesChange;
    this.autoReconnectEnabled = !disableAutoReconnect;
    this.initialize();
  }

  private initialize() {
    // console.log("Attempting to connect to Kinode...", this.our, this.websocket_url);
    if (!(this.our.node && this.our.process)) {
      return;
    }
    this.serviceMetadata = null;
    this.fullServiceMetadata = null;
    this.serviceConnectionStatus = null;

    const newApi = new KinodeClientApi({
      uri: this.websocket_url,
      nodeId: this.our.node,
      processId: this.our.process,
      onClose: (event) => {
        console.log("Disconnected from Kinode");
        this.setConnectionStatus(ConnectionStatusType.Disconnected);
        this.onClose();
        if (this.heartbeatInterval) {
          clearInterval(this.heartbeatInterval);
          this.heartbeatInterval = null;
        }
        if (this.autoReconnectEnabled) {
          console.log("Auto-reconnect is enabled. Will attempt to reconnect...");
          this.startReconnectInterval();
        } else {
          console.log("Auto-reconnect is disabled. No reconnection attempts will be made.");
        }
      },
      onOpen: (event, api) => {
        console.log("Connected to Kinode");
        this.onOpen(this);
        if (this.serviceId) {
          this.setServiceConnectionStatus(ServiceConnectionStatusType.Connecting);
          this.onServiceConnectionStatusChange(this);
          this.setService(this.serviceId);
        }

        this.heartbeatInterval = setInterval(() => {
          this.sendHeartbeat();
        }, 60*1000);

        this.setConnectionStatus(ConnectionStatusType.Connected);
        this.stopReconnectInterval();
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

  private startReconnectInterval() {
    if (!this.reconnectInterval) {
      this.reconnectAttempts = 0;
      this.reconnectInterval = setInterval(() => {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect... (Attempt ${this.reconnectAttempts})`);
        this.initialize();
      }, 5000);
    }
  }

  private stopReconnectInterval() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
      if (this.reconnectAttempts > 0) {
        console.log(`Successfully reconnected after ${this.reconnectAttempts} attempt(s)`);
      }
      this.reconnectAttempts = 0;
    }
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

  public sendToProcess(data:any) {
    let req = {"Meta":
                {"MessageProcess":
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

  public createService(options: ServiceCreationOptions) {
    let req = {
      "Meta": {
        "CreateService": {
          service_name: options.serviceName,
          process_name: options.processName,
          access: options.access,
          visibility: options.visibility,
          whitelist: options.whitelist,
          title: options.title,
          description: options.description,
          publish_user_presence: options.publishUserPresence,
          publish_subscribers: options.publishSubscribers,
          publish_subscriber_count: options.publishSubscriberCount,
          publish_whitelist: options.publishWhitelist
        }
      }
    }
    this.sendRequest(req)
  }
  public deleteService(name:string) {
    let req = {"Meta": {"DeleteService": name}}
    this.sendRequest(req);
  }

  public editService(serviceId: string, options: ServiceEditOptions) {
    const req = {
      "Meta": {
        "EditService": [
          serviceId,
          options
        ]
      }
    };
    console.log("editing service", req)
    this.sendRequest(req);
  }

  public requestMyServices() {
    let req = {"Meta": "RequestMyServices"}
    this.sendRequest(req);
  }

  public requestPeer(node:string) {
    let req = {"Meta": {
      "RequestPeer":
        node
      }
    }
    this.sendRequest(req);
  }

  public requestPeerList(nodeList: string[] ) {
    let req = {"Meta": {
      "RequestPeerList":
        nodeList
      }
    }
    this.sendRequest(req);
  }

  public requestKnownPeers() {
    let req = {"Meta": 
      "RequestKnownPeers"
    }
    this.sendRequest(req);
  }

  private updateHandler(jsonString: any) {
    const data = JSON.parse(jsonString)

    if (data["Meta"]) {
      const metaUpd = data["Meta"]
      if (metaUpd["Peer"]) {
        const jsonPeer = metaUpd["Peer"]
        let peer = peerFromJson(jsonPeer);
        this.peerMap.set(peer.node, peer)
        this.onPeerMapChange(this);
      } else if (metaUpd["PeerList"]) {
        const jsonPeers = metaUpd["PeerList"]
        for (const jsonPeer of jsonPeers) {
          let peer = peerFromJson(jsonPeer);
          this.peerMap.set(peer.node, peer);
        }
        this.onPeerMapChange(this);
      } else if (metaUpd["MyServices"]) {
        const myServices = metaUpd["MyServices"]
        let parsedMyServices = []
        for (const service of myServices) {
          const parsedService = serviceFromJson(service);
          parsedMyServices.push(parsedService)
        }
        this.localServices = parsedMyServices;
        this.onLocalServicesChange(this);
      } else if (metaUpd["FromProcess"]) {
        const fromProcess = metaUpd["FromProcess"]
        const msg = JSON.parse(fromProcess);
        this.onProcessMessage(msg);
      } else {
        console.log("todo handle metaupdate'", metaUpd)
      }
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
        const meta = channelUpd["Metadata"]
        const parsedMeta = serviceMetadataFromJson(meta);
        this.fullServiceMetadata = parsedMeta;
        this.onFullServiceMetadataChange(this);
      } else if (channelUpd["PublicMetadata"]) {
        this.setServiceConnectionStatus(ServiceConnectionStatusType.Connected);
        const meta = channelUpd["PublicMetadata"]
        const parsedMeta = publicServiceMetadataFromJson(meta);
        this.serviceMetadata = parsedMeta;
        this.onServiceMetadataChange(this);
        // Collect nodes into a list and request them in a batch
        const nodesToRequest: string[] = [];
        if (parsedMeta.user_presence) {
          parsedMeta.user_presence.forEach((_, node) => {
            if (!this.peerMap.has(node)) {
              this.peerMap.set(node, Peer.new(node));
              nodesToRequest.push(node);
            }
          });
        }
        if (nodesToRequest.length > 0) {
          this.requestPeerList(nodesToRequest);
        }
      } else if (channelUpd["Metadata"]) {
        const fullMeta = channelUpd["Metadata"]
        const parsedFullMeta = serviceMetadataFromJson(fullMeta);
        this.fullServiceMetadata = parsedFullMeta;
        this.onFullServiceMetadataChange(this);
      } else if (channelUpd["Kick"]) {
        const kick = channelUpd["Kick"]
        if (kick === "ServiceDeleted")
        this.setServiceConnectionStatus(ServiceConnectionStatusType.ServiceDeleted);

      } else if (channelUpd["FromClient"]) {
        const msg = JSON.parse(channelUpd["FromClient"])
        this.onClientMessage(msg)
      } else if (channelUpd["FromServer"]) {
        const msg = JSON.parse(channelUpd["FromServer"])
        this.onServiceMessage(msg)
      } else {
        console.log('unhandled update', data)
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

export interface PublicService {
  id: ServiceID;
  meta: PublicServiceMetadata;
}

export interface ServiceMetadata {
  title?: string;
  description?: string;
  last_sent_presence: number | null;
  subscribers: string[];
  user_presence: Map<string, number>;
  access: ServiceAccess;
  visibility: ServiceVisibility;
  whitelist: string[];
  publish_user_presence: boolean;
  publish_subscribers: boolean;
  publish_subscriber_count: boolean;
  publish_whitelist: boolean;
}

export class ServiceMetadata {
  constructor({
    title = undefined,
    description = undefined,
    last_sent_presence = null,
    subscribers = [],
    user_presence = new Map<string, number>(),
    access = ServiceAccess.Public,
    visibility = ServiceVisibility.Visible,
    whitelist = [],
    publish_user_presence = false,
    publish_subscribers = false,
    publish_subscriber_count = false,
    publish_whitelist = false
  }: Partial<ServiceMetadata>) {
    this.title = title;
    this.description = description;
    this.last_sent_presence = last_sent_presence;
    this.subscribers = subscribers;
    this.user_presence = user_presence;
    this.access = access;
    this.visibility = visibility;
    this.whitelist = whitelist;
    this.publish_user_presence = publish_user_presence;
    this.publish_subscribers = publish_subscribers;
    this.publish_subscriber_count = publish_subscriber_count;
    this.publish_whitelist = publish_whitelist;
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
    title?: string;
    description?: string;
    last_sent_presence: number | null;
    subscribers: string[];
    user_presence: { [key: string]: number };
    access: ServiceAccess;
    visibility: ServiceVisibility;
    whitelist: string[];
    publish_user_presence: boolean;
    publish_subscribers: boolean;
    publish_subscriber_count: boolean;
    publish_whitelist: boolean;
  };
}

export interface ServiceCreationOptions {
  serviceName: string;
  processName: string;
  access: ServiceAccess;
  visibility: ServiceVisibility;
  whitelist: string[];
  title?: string;
  description?: string;
  publishUserPresence: boolean;
  publishSubscribers: boolean;
  publishSubscriberCount: boolean;
  publishWhitelist: boolean;
}

export interface ServiceEditOptions {
  title?: string;
  description?: string;
  access?: ServiceAccess;
  visibility?: ServiceVisibility;
  whitelist?: string[];
  publishUserPresence?: boolean;
  publishSubscribers?: boolean;
  publishSubscriberCount?: boolean;
  publishWhitelist?: boolean;
}


export function serviceFromJson(jsonService: JsonService): Service {
  return {
    id: new ServiceID(jsonService.id.name, jsonService.id.address),
    meta: serviceMetadataFromJson(jsonService.meta)
  };
}

export function serviceMetadataFromJson(jsonMeta: JsonService['meta']): ServiceMetadata {
  return new ServiceMetadata({
    title: jsonMeta.title,
    description: jsonMeta.description,
    last_sent_presence: jsonMeta.last_sent_presence,
    subscribers: jsonMeta.subscribers,
    user_presence: new Map(Object.entries(jsonMeta.user_presence)),
    access: jsonMeta.access,
    visibility: jsonMeta.visibility,
    whitelist: jsonMeta.whitelist,
    publish_user_presence: jsonMeta.publish_user_presence,
    publish_subscribers: jsonMeta.publish_subscribers,
    publish_subscriber_count: jsonMeta.publish_subscriber_count,
    publish_whitelist: jsonMeta.publish_whitelist,
  });
}

export function publicServiceFromJson(jsonService: any): PublicService {
  return {
    id: new ServiceID(jsonService.id.name, jsonService.id.address),
    meta: publicServiceMetadataFromJson(jsonService.meta)
  };
}
export function publicServiceMetadataFromJson(jsonMeta: any): PublicServiceMetadata {
  return {
    title: jsonMeta.title,
    description: jsonMeta.description,
    last_sent_presence: jsonMeta.last_sent_presence,
    subscribers: jsonMeta.subscribers,
    subscriber_count: jsonMeta.subscriber_count,
    user_presence: jsonMeta.user_presence ? new Map(Object.entries(jsonMeta.user_presence)) : undefined,
    access: jsonMeta.access as ServiceAccess,
    visibility: jsonMeta.visibility as ServiceVisibility,
    whitelist: jsonMeta.whitelist,
  };
}

export interface PublicServiceMetadata {
  title?: string;
  description?: string;
  last_sent_presence: number | null;
  subscribers?: string[],
  subscriber_count?: number;
  user_presence?: Map<string, number>;
  access: ServiceAccess;
  visibility: ServiceVisibility;
  whitelist?: string[];
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
    return new Profile("", NameColor.Default, undefined);
  }
}

export interface PeerData {
  hostedServices: PublicService[];
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
    hostedServices: json.peer_data.hosted_services.map((service: any) => publicServiceFromJson(service)),
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

export function nodeProfileLink(node: string, baseOrigin:string) {
  return `http://${baseOrigin}/dartfrog:dartfrog:herobrine.os/nodes/${node}`
}



export const DEFAULT_PFP = 'https://bwyl.nyc3.digitaloceanspaces.com/kinode/dartfrog/dartfrog256_small_nobg.png'
export function getPeerPfp(peer: Peer | undefined): string {
  if (peer && peer.peerData && peer.peerData.profile.pfp) {
    return peer.peerData.profile.pfp
  }
  return DEFAULT_PFP;
}
export function getPeerNameColor(peer: Peer | undefined): string {
  if (peer && peer.peerData) {
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

export function serviceMetadataToEditOptions(metadata: ServiceMetadata): ServiceEditOptions {
  return {
    title: metadata.title,
    description: metadata.description,
    access: metadata.access,
    visibility: metadata.visibility,
    whitelist: metadata.whitelist,
    publishUserPresence: metadata.publish_user_presence,
    publishSubscribers: metadata.publish_subscribers,
    publishSubscriberCount: metadata.publish_subscriber_count,
    publishWhitelist: metadata.publish_whitelist,
  };
}

export function getServiceRecencyText(service: Service) {
  const now = new Date();
  if (!(service.meta.last_sent_presence)) {
    return ""
  }
  const time = service.meta.last_sent_presence
  const diff = now.getTime() - time*1000;

  // if less than 5min, say now
  // if less than 1h, say x min ago
  // if less than 1d, say x hr ago
  // else say x days ago
  // if (service.meta.subscribers.length > 0) {
  //   return `now`;
  // }
  return getRecencyText(diff);
}

export function getRecencyText(diff:number) {
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins} ${mins === 1 ? 'min' : 'mins'} ago`;
  }
  if (diff < 86400000) {
    const hrs = Math.floor(diff / 3600000);
    return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'} ago`;
  }
  if (diff > 7307200000) {
    const years = Math.floor(diff / 31536000000);
    const months = Math.floor((diff % 31536000000) / 2592000000);
    return `${years} ${years === 1 ? 'yr' : 'yrs'} ${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  const days = Math.floor(diff / 86400000);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export function getAllServicesFromPeerMap(peerMap: PeerMap): PublicService[] {
  const allServices: PublicService[] = [];
  
  peerMap.forEach(peer => {
    if (peer.peerData && peer.peerData.hostedServices) {
      allServices.push(...peer.peerData.hostedServices);
    }
  });

  return allServices;
}

export function sortServices(services) {
  const fiveMinutesAgo = Date.now() / 1000 - 5 * 60; // Convert to seconds and subtract 5 minutes

  return services.sort((a, b) => {
    const aAffectedByBug = (a.meta.last_sent_presence ?? 0) < fiveMinutesAgo;
    const bAffectedByBug = (b.meta.last_sent_presence ?? 0) < fiveMinutesAgo;

    if (!aAffectedByBug && !bAffectedByBug) {
      // If neither is affected by the bug, sort by subscriber count
      const aSubCount = a.meta.subscriber_count ?? a.meta.subscribers?.length ?? 0;
      const bSubCount = b.meta.subscriber_count ?? b.meta.subscribers?.length ?? 0;
      const subDiff = bSubCount - aSubCount;
      if (subDiff !== 0) return subDiff;
    }

    // If one or both are affected by the bug, or if subscriber counts are equal,
    // sort by last_sent_presence
    const aMaxTime = a.meta.last_sent_presence ?? 0;
    const bMaxTime = b.meta.last_sent_presence ?? 0;
    return bMaxTime - aMaxTime;
  });
}
export const getUniqueServices = (services: Service[], publicServices: PublicService[]): PublicService[] => {
  const uniqueServices = new Map<string, PublicService>();

  // Convert and add private services first
  services.forEach(service => {
    const serviceId = service.id.toString();
    const publicService: PublicService = {
      id: service.id,
      meta: {
        title: service.meta.title,
        description: service.meta.description,
        last_sent_presence: service.meta.last_sent_presence,
        subscribers: service.meta.subscribers,
        subscriber_count: service.meta.subscribers.length,
        user_presence: service.meta.user_presence,
        access: service.meta.access,
        visibility: service.meta.visibility,
        whitelist: service.meta.whitelist,
      }
    };
    uniqueServices.set(serviceId, publicService);
  });

  // Add public services only if they're not already in the map
  publicServices.forEach(service => {
    const serviceId = service.id.toString();
    if (!uniqueServices.has(serviceId)) {
      uniqueServices.set(serviceId, service);
    }
  });

  return Array.from(uniqueServices.values());
};

