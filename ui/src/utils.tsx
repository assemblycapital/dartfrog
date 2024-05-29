
export const BASE_URL = import.meta.env.BASE_URL;
if (window.our) window.our.process = BASE_URL?.replace("/", "");

export const PROXY_TARGET = `${(import.meta.env.VITE_NODE_URL || "http://localhost:8080")}${BASE_URL}`;

// This env also has BASE_URL which should match the process + package name
export const WEBSOCKET_URL = import.meta.env.DEV
  ? `${PROXY_TARGET.replace('http', 'ws')}`
  : undefined;


export const sendPoke =  async (data) => {
    try {
      const result = await fetch(`${BASE_URL}/api`, {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!result.ok) throw new Error("HTTP request failed");

      // Add the message if the POST request was successful
    } catch (error) {
      console.error(error);
    }
    
  }

export const pokeSubscribe = () => {
    const data = {"ClientRequest": {"SetServer": "fake.dev@dartfrog:dartfrog:template.os"}};
    sendPoke(data);
  }

export const pokeHeartbeat = () => {
    const data = {"ClientRequest": {"SendToServer": "PresenceHearbeat"}};
    sendPoke(data);
  }



export function computeColorForName(name: string): string {
  let hash: number = Math.abs(simpleHash(name));
  let color: string;

  let numColors = 5;
  switch (hash % numColors) {
    case 0:
      // red
      color = '#cc4444';
      break;
    case 1:
      // blue
      color = '#339933';
      break;
    case 2:
      // green
      color = '#4682B4';
      break;
    case 3:
      // orange
      color = '#cc7a00';
      break;
    case 4:
      // purple
      color = '#a36bdb';
      break;
    default:
      color= '#ffffff';
      break;
  }

  console.log('computeColorForName')
  return color;
}

export function simpleHash(source: string): number {
  let hash = 0;

  for (let i = 0; i < source.length; i++) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return hash;
}
