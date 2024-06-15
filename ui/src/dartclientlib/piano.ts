import { timeStamp } from "console";
import { ServiceId } from ".";
import { ChatMessageHistory } from "../types/types";
import { maybePlaySoundEffect } from "../utils";

export type NotePlayed = {
  note: string;
  from: string;
  timestamp: number;
};

export type PianoState = {
  notePlayed: NotePlayed | null;
};

export function handlePianoUpdate(pianoState: PianoState, update: any): PianoState {
    update = JSON.parse(update);
    if (!update) return pianoState; // Return existing state if update is null

    if (update['NotePlayed']) {
      const [from, note] = update.NotePlayed;
      const newNotePlayed: NotePlayed = {
        note: note,
        from: from,
        timestamp: Date.now(),
      };
      // Return a new object instead of mutating the existing state
      return {
        ...pianoState,
        notePlayed: newNotePlayed
      };
    } else {
      console.log('unknown piano update', update);
      return pianoState; // Return existing state if the update is unknown
    }
}

