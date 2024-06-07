import { ServiceId } from ".";
import { ChatMessageHistory } from "../types/types";


// export interface ChatObjectConstructorArgs {
//   serviceId: ServiceId;
//   messageSender: (message: string) => void;
// }


export type ChatState = {
  messages: ChatMessageHistory;
}

export function handleChatUpdate(chatState: ChatState, update: any) {
    if (!update) return;
    if (update['Message']) {
      chatState.messages.set(update.Message.id, update.Message);
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