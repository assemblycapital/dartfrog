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
    console.log('raw piano update', update);
    update = JSON.parse(update);
    console.log('parsed piano update', update);
    if (!update) return;
    if (update['NotePlayed']) {
      console.log('note played', update.NotePlayed);
      let [from, note] = update.NotePlayed;
      pianoState.notePlayed = {
        note: note,
        from: from
      }
    } else {
      console.log('unknown piano update', update);
    }
    return pianoState;
}
