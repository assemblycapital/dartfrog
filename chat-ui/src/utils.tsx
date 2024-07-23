export const IS_FAKE = false;
export const HUB_NODE = IS_FAKE ? "fake.dev" : "waterhouse.os";
export const PACKAGE_SUBDOMAIN = "dartfrog-herobrine-os";
export const PROCESS_NAME = "chat:dartfrog:herobrine.os";

export const BASE_URL = `/${PROCESS_NAME}/`;

// if (window.our) window.our.process = BASE_URL?.replace("/", "");

export const PROXY_TARGET = `${(import.meta.env.VITE_NODE_URL || `http://${PACKAGE_SUBDOMAIN}.localhost:8080`)}${BASE_URL}`;

// This env also has BASE_URL which should match the process + package name
export const WEBSOCKET_URL = import.meta.env.DEV
  ? `${PROXY_TARGET.replace('http', 'ws')}`
  : undefined;

const soundEffectFiles = {
  '/fart': 'wet.mp3',
  '/no': 'hell-naw-dog.mp3',
  '/yes': 'oh-yes.mp3',
  '/why': 'why.mp3',
  '/people': 'the-people.mp3',
  '/robust': 'robust-josh.mp3',
  '/robustness': 'robust-basile.mp3',
};

export const soundEffectCommands = Object.fromEntries(
  Object.entries(soundEffectFiles).map(([command, fileName]) => [
    command,
    `/${PROCESS_NAME}/assets/${fileName}`,
  ])
);

export const maybePlayTTS = (msg: string) => {
  const mute = sessionStorage.getItem("mute") === "true";
  if (!mute) {
    const commandPrefix = "/tts ";
    if (msg.startsWith(commandPrefix)) {
      const textToSpeak = msg.slice(commandPrefix.length);
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      window.speechSynthesis.speak(utterance);
    }
  }
}
export const maybePlaySoundEffect = (msg: string) => {

  if (msg in soundEffectCommands) {
    const sound = new Audio(soundEffectCommands[msg]);
    sound.play();
  }

}


export const imageCommands = {
  '/die': 'https://bwyl.nyc3.digitaloceanspaces.com/kinode/dartfrog/chat_images/die.webp',
  '/kino': 'https://bwyl.nyc3.digitaloceanspaces.com/kinode/dartfrog/chat_images/kino.webp',
  '/panda': 'https://bwyl.nyc3.digitaloceanspaces.com/kinode/dartfrog/chat_images/panda.jpeg',
  '/dev': 'https://bwyl.nyc3.digitaloceanspaces.com/kinode/dartfrog/chat_images/dev.jpeg',
  '/tiger': 'https://bwyl.nyc3.digitaloceanspaces.com/kinode/dartfrog/chat_images/tiger.jpeg',
  '/wow': 'https://bwyl.nyc3.digitaloceanspaces.com/kinode/dartfrog/chat_images/wow.jpeg',
  '/cry': 'https://bwyl.nyc3.digitaloceanspaces.com/kinode/dartfrog/chat_images/cry.jpeg',
  '/ok': 'https://bwyl.nyc3.digitaloceanspaces.com/kinode/dartfrog/chat_images/ok.jpeg',
  '/oops': 'https://bwyl.nyc3.digitaloceanspaces.com/kinode/dartfrog/chat_images/oops.jpeg',
}

export const maybeReplaceWithImage = (msg: string) => {
  if (msg in imageCommands) {
      return imageCommands[msg];
  }
  return msg
}