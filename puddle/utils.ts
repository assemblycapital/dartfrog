
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