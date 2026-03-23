function getRandomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function generateTeamName(): string {
  const adjective = getRandomElement(adjectives);
  const animal = getRandomElement(animals);
  return `${adjective} ${animal}`;
}

const adjectives = [
  'Agile',
  'Brave',
  'Calm',
  'Swift',
  'Sharp',
  'Bold',
  'Fierce',
  'Lucky',
  'Rapid',
  'Steady',
  'Noble',
  'Smart',
  'Prime',
  'Flash',
] as const;
const animals = [
  'Owls',
  'Lynx',
  'Wolves',
  'Lions',
  'Tigers',
  'Eagles',
  'Falcons',
  'Hawks',
  'Foxes',
  'Bulls',
  'Ravens',
  'Pandas',
  'Cobras',
  'Vipers',
  'Pumas',
] as const;
