function getRandomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function generateTeamName(): string {
  const adjective = getRandomElement(adjectives);
  const color = getRandomElement(colors);
  const animal = getRandomElement(animals);
  return `${adjective} ${color} ${animal}`;
}

const adjectives = [
  'Mighty',
  'Brave',
  'Cunning',
  'Swift',
  'Eager',
  'Bold',
  'Fierce',
  'Wild',
  'Fearless',
  'Invincible',
  'Resolute',
  'Luminous',
  'Dynamic',
  'Majestic',
  'Noble',
  'Glorious',
  'Radiant',
  'Savage',
  'Heroic',
  'Stellar',
  'Vibrant',
  'Terrific',
  'Magnificent',
  'Splendid',
] as const;
const colors = [
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Black',
  'White',
  'Purple',
  'Orange',
  'Brown',
  'Silver',
] as const;
const animals = [
  'Lions',
  'Tigers',
  'Bears',
  'Wolves',
  'Eagles',
  'Hawks',
  'Sharks',
  'Panthers',
  'Dragons',
  'Falcons',
  'Cobras',
  'Foxes',
  'Ravens',
  'Pythons',
  'Jaguars',
  'Leopards',
  'Elephants',
  'Vipers',
  'Scorpions',
  'Pumas',
  'Crocodiles',
] as const;
