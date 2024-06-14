import { ServiceId } from ".";
import { ChatMessageHistory } from "../types/types";
import { maybePlaySoundEffect } from "../utils";

export type NotePlayed = {
  note: string;
  from: string;
}
export type PianoState = {
  notePlayed:  NotePlayed | null;
}

export function handlePianoUpdate(pianoState: PianoState, update: any) {
    update = JSON.parse(update);
    if (!update) return;
    if (update['NotePlayed']) {
      console.log('note played', update.NotePlayed);
      let [from, note] = update.NotePlayed;
      let newNotePlayed = {
        note: note,
        from: from
      }
      pianoState.notePlayed = newNotePlayed;
    } else {
      console.log('unknown piano update', update);
    }
    return pianoState;
}
