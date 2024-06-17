import { ServiceId } from ".";
import { ChatMessageHistory } from "../types/types";
import { maybePlaySoundEffect } from "../utils";

export type ChatState = {
  messages: ChatMessageHistory;
}

export function handleChatUpdate(chatState: ChatState, update: any) {
    update = JSON.parse(update);
    if (!update) return;
    if (update['Message']) {
      chatState.messages.set(update.Message.id, update.Message);
      maybePlaySoundEffect(update.Message.msg, false);
    } else if(update['FullMessageHistory']) {
      chatState.messages = new Map()
      for (let msg of update.FullMessageHistory) {
        chatState.messages.set(msg.id, msg);
      }
    } else {
      console.log('unknown chat update', update);
    }
    return {
      messages: new Map(chatState.messages)
    }
}
