export type ChatMessage = {
  id: number;
  time: number;
  from: string;
  msg: string;
}

export type ChatMessageHistory = Map<number, ChatMessage>;

export type UserActivity = {
  name: string;
  time: number;
  was_online_at_time: boolean;
}

export type ServerStatus = {
  name: string;
  connection: ConnectionStatus;
}

export enum ConnectionStatusType {
  Connecting,
  Connected,
  Disconnected,
}

export type ConnectionStatus = 
  | { type: ConnectionStatusType.Connecting, timestamp: number }
  | { type: ConnectionStatusType.Connected, timestamp: number }
  | { type: ConnectionStatusType.Disconnected };
