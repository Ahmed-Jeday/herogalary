export const IMGS = [
  {
    id: '/experiments/The Batman.png',
    src: '/experiments/The Batman.png',
    label: 'THE DARK KNIGHT',
    desc: 'Gotham City’s silent guardian, a symbol of justice forged in darkness.'
  },
  {
    id: '/experiments/lokis2.jpg',
    src: '/experiments/lokis2.jpg',
    label: 'GOD OF MISCHIEF',
    desc: 'Loki, the master of deception, navigating the chaos of timelines and alternate realities.'
  },
  {
    id: '/experiments/visionQuest.jpg',
    src: '/experiments/visionQuest.jpg',
    label: 'VISION QUEST',
    desc: 'A journey beyond humanity, exploring identity, consciousness, and the nature of being.'
  },
  {
    id: '/experiments/LANTERNS.jpg',
    src: '/experiments/LANTERNS.jpg',
    label: 'GREEN LANTERNS',
    desc: 'Guardians of the universe, wielding the power of will through the emerald light.'
  },
  {
    id: '/experiments/avengers Doomsday.jpg',
    src: '/experiments/avengers Doomsday.jpg',
    label: 'DOOMSDAY',
    desc: 'The Avengers face an unprecedented threat as the fate of the multiverse hangs in the balance.'
  },
  {
    id: '/experiments/The Batman.png',
    src: '/experiments/The Batman.png',
    label: 'GOTHAM FILES',
    desc: 'Every shadow hides a secret. Every crime leaves a trace. Gotham never sleeps.'
  },
  {
    id: '/experiments/lokis2.jpg',
    src: '/experiments/lokis2.jpg',
    label: 'TIME VARIANCE',
    desc: 'Beyond the sacred timeline, infinite possibilities collide in a universe without rules.'
  },
  {
    id: '/experiments/visionQuest.jpg',
    src: '/experiments/visionQuest.jpg',
    label: 'SYNTHETIC SOUL',
    desc: 'An artificial mind searching for purpose, memory, and what it truly means to be alive.'
  },
  {
    id: '/experiments/LANTERNS.jpg',
    src: '/experiments/LANTERNS.jpg',
    label: 'EMERALD LEGACY',
    desc: 'Across the darkest corners of space, the Green Lantern Corps stands against fear.'
  },
  {
    id: '/experiments/avengers Doomsday.jpg',
    src: '/experiments/avengers Doomsday.jpg',
    label: 'MULTIVERSE WAR',
    desc: 'Heroes from across realities unite against a destiny that threatens every universe.'
  }
];

// proxy renvoie simplement le chemin — le paramètre w est ignoré
export const proxy = (src, w) => (typeof src === 'object' && src !== null ? (src.src || src.id) : src);

export const PAL = {
  BLACK:  [0.055, 0.055, 0.065],
  RED:    [0.085, 0.050, 0.060],
  GREEN:  [0.059, 0.055, 0.078],
  YELLOW: [0.080, 0.075, 0.050],
  BLUE:   [0.050, 0.060, 0.090]
};

export const CROSS_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261119_115952_fb332608-6f05-451c-9416-bbba87baffce.mp4';
