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
}
