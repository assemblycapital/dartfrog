import { ServiceId } from ".";
import { ChatMessageHistory } from "../types/types";
import { maybePlaySoundEffect } from "../utils";


// export interface ChatObjectConstructorArgs {
//   serviceId: ServiceId;
//   messageSender: (message: string) => void;
// }


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
// export class ChatObject {
//   public serviceId: ServiceId;
//   public messages: ChatMessageHistory = new Map();

//   private messageSender: (message: string) => void;

//   constructor({
//     serviceId,
//     messageSender,
//   }: ChatObjectConstructorArgs) {
//     this.serviceId = serviceId;
//     this.messageSender = messageSender;
//   }

//   setMessageSender(messageSender: (message: string) => void) {
//     this.messageSender = messageSender;
//   }

//   sendMessage() {

//   }

//   handleUpdate(update: any) {


//   }

// }