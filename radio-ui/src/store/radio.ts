import { ServiceApi } from '@dartfrog/puddle';
import { create } from 'zustand'

export interface MediaMetadata {
  is_livestream: boolean;
  is_audio_only: boolean;
  duration: number | null;
  title: string | null;
  description: string | null;
  tags: string[];
}

export interface Media {
  url: string;
  meta: MediaMetadata;
}

export interface PlayingMedia {
  media: Media;
  start_time: number | null;
}

export interface RadioStore {
  playingMedia: PlayingMedia | null;
  setPlayingMedia: (playingMedia: PlayingMedia | null) => void;
  requestPlayMedia: (api: ServiceApi, url:string) => void;
  requestPlayMediaTime: (api: ServiceApi, time:number|null) => void;
  get: () => RadioStore;
  set: (partial: RadioStore | Partial<RadioStore>) => void;
}

const useRadioStore = create<RadioStore>((set, get) => ({
  playingMedia: null,
  setPlayingMedia: (playingMedia) => set({playingMedia}),
  requestPlayMedia: (api, url) => {
    let req = 
      {
      "Radio": {
        "PlayMedia" :
        [
          url,
          null
        ]
      }
    }
    api.sendToService(req);
  },
  requestPlayMediaTime: (api, time) => {
    let req = 
      {
      "Radio": {
        "PlayMediaStartTime" :
          time
      }
    }
    api.sendToService(req);
  },
  get,
  set,
}))

export default useRadioStore;