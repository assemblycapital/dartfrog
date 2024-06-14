import { timeStamp } from "console";
import { ServiceId } from ".";
import { ChatMessageHistory } from "../types/types";
import { maybePlaySoundEffect } from "../utils";


export type PageState = {
  page: string;
};

export function newPageState() {
 return {
    page: ''
  }
}

export function handlePageUpdate(pageState: PageState, update: any): PageState{
    update = JSON.parse(update);
    if (!update) return pageState; // Return existing state if update is null

    if (update['PageState'] !== undefined) {
      // Return a new object instead of mutating the existing state
      return {
        ...pageState,
        page: update.PageState
      };
    } else {
      console.log('unknown page update', update);
      return pageState; // Return existing state if the update is unknown
    }
}

