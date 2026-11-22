// ─── Catalogue de films ───────────────────────────────────────────────────────
// Réutilise les images déjà présentes dans public/experiments/
// Pour ajouter un film : ajouter un objet dans MOVIES — rien d'autre à toucher.

export const MOVIES = [
  {
    id: 'm001',
    title: 'THE BATMAN',
    originalTitle: 'The Batman',
    year: 2022,
    director: 'Matt Reeves',
    runtime: 176,
    genres: ['Action', 'Crime', 'Thriller'],
    synopsis:
      'Dans sa deuxième année de croisade contre le crime, Batman démêle la corruption qui ronge Gotham quand un tueur en série sen prend aux élites de la ville.',
    poster: '/experiments/The Batman.png',
    backdrop: '/experiments/The Batman.png',
    trailer: 'https://www.youtube.com/watch?v=mqqft2x_Aa4',
    price: { rent: 3.99, buy: 12.99 },
    ratingAvg: 4.3,
    ratingCount: 18420,
    tags: ['batman', 'gotham', 'dc', 'reeves'],
  },
  {
    id: 'm002',
    title: 'LOKI — SEASON 2',
    originalTitle: 'Loki',
    year: 2023,
    director: 'Justin Benson & Aaron Moorhead',
    runtime: 50,
    genres: ['Sci-Fi', 'Fantasy', 'Adventure'],
    synopsis:
      'Le dieu de la malice lutte à travers le temps pour sauver lexistence de lAutorité de Variance Temporelle et de chaque réalité.',
    poster: '/experiments/lokis2.jpg',
    backdrop: '/experiments/lokis2.jpg',
    trailer: 'https://www.youtube.com/watch?v=nW948Va-l10',
    price: { rent: 2.99, buy: 9.99 },
    ratingAvg: 4.6,
    ratingCount: 22150,
    tags: ['loki', 'marvel', 'avl', 'multiversum'],
  },
  {
    id: 'm003',
    title: 'VISION QUEST',
    originalTitle: 'Vision Quest',
    year: 2024,
    director: 'James Mangold',
    runtime: 134,
    genres: ['Sci-Fi', 'Drama'],
    synopsis:
      'Un androïde doué de conscience cherche sa place dans un monde qui refuse de le reconnaître comme vivant.',
    poster: '/experiments/visionQuest.jpg',
    backdrop: '/experiments/visionQuest.jpg',
    trailer: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    price: { rent: 3.49, buy: 11.99 },
    ratingAvg: 4.1,
    ratingCount: 9870,
    tags: ['vision', 'ia', 'android', 'conscience'],
  },
  {
    id: 'm004',
    title: 'GREEN LANTERNS',
    originalTitle: 'Green Lantern Corps',
    year: 2025,
    director: 'David F. Sandberg',
    runtime: 142,
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    synopsis:
      'Les gardiens de lunivers unissent leurs forces pour repousser une menace cosmique capable déteindre toute lumière.',
    poster: '/experiments/LANTERNS.jpg',
    backdrop: '/experiments/LANTERNS.jpg',
    trailer: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    price: { rent: 3.99, buy: 13.99 },
    ratingAvg: 4.0,
    ratingCount: 7340,
    tags: ['dc', 'green lantern', 'espace', 'corps'],
  },
  {
    id: 'm005',
    title: 'AVENGERS: DOOMSDAY',
    originalTitle: 'Avengers: Doomsday',
    year: 2026,
    director: 'Joe & Anthony Russo',
    runtime: 165,
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    synopsis:
      'Toutes les réalités convergent vers une seule guerre. Les Avengers de chaque univers affrontent la menace ultime.',
    poster: '/experiments/avengers Doomsday.jpg',
    backdrop: '/experiments/avengers Doomsday.jpg',
    trailer: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    price: { rent: 4.99, buy: 15.99 },
    ratingAvg: 4.8,
    ratingCount: 54300,
    tags: ['avengers', 'marvel', 'doomsday', 'doom'],
  },
];

// N dynamique — utilisé dans lab.js
export const N = MOVIES.length;

// Résout le chemin d'une affiche (compatible usage futur CDN / S3)
export const posterSrc = (movie) => movie.poster;

// Rétro-compatibilité : lab.js peut importer IMGS comme avant
export const IMGS = MOVIES.map((m) => ({
  id: m.poster,
  src: m.poster,
  label: m.title,
  desc: m.synopsis,
  _movie: m,
}));

// proxy identique à experiments.js (chemin local, w ignoré)
export const proxy = (src) =>
  typeof src === 'object' && src !== null ? src.src || src.id : src;

// Réexporte PAL et CROSS_VIDEO pour ne pas casser les imports existants dans App.jsx
export const PAL = {
  BLACK:  [0.055, 0.055, 0.065],
  RED:    [0.085, 0.050, 0.060],
  GREEN:  [0.059, 0.055, 0.078],
  YELLOW: [0.080, 0.075, 0.050],
  BLUE:   [0.050, 0.060, 0.090],
};

export const CROSS_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261119_115952_fb332608-6f05-451c-9416-bbba87baffce.mp4';
