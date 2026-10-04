import type { Tx } from '../i18n';
// The studio's shipped and in-progress work. Screens in the world show each project's screenshot
// (public/projects/<id>.webp); a short muted .mp4 can replace it later via `video`.
export type Reel = { id: string; title: string; kind: 'game' | 'web' | 'app'; url: string; blurb: Tx; status?: Tx; video?: string };
export const reels: Reel[] = [
  { id: 'platypals', title: 'Platy Pals', kind: 'game', url: 'https://platypals.com', blurb: { en: 'A plush-character brand with mini-games, a trading card game, a shop and live platypus cams.', es: 'Una marca de peluches con minijuegos, un juego de cartas coleccionables, tienda y cámaras de ornitorrincos en vivo.' } },
  { id: 'feepink', title: 'fee.pink', kind: 'web', url: 'https://fee.pink', blurb: { en: 'Paste a Solana wallet and see, in seconds, whether you are overpaying on fees, with a shareable score.', es: 'Pega una wallet de Solana y ve en segundos si estás pagando de más en comisiones, con un puntaje para compartir.' } },
  { id: 'pokernight', title: 'Poker Night', kind: 'game', url: 'https://pokernight.onl', blurb: { en: 'Real-time multiplayer Texas Hold’em in the browser: tables, chat, leaderboard and store.', es: 'Texas Hold’em multijugador en tiempo real en el navegador: mesas, chat, clasificación y tienda.' } },
  { id: 'else', title: 'ELSE', kind: 'web', url: 'https://else.onl', blurb: { en: 'Real-time Solana token analysis: momentum, whale tracking, liquidity events and a Chrome extension.', es: 'Análisis de tokens de Solana en tiempo real: momentum, ballenas, eventos de liquidez y extensión para Chrome.' } },
  { id: 'crimsonfall', title: 'Crimson Fall', kind: 'game', url: 'https://crimsonfall.vercel.app/', blurb: { en: 'A story-driven dark fantasy action game where the world remembers every choice.', es: 'Un juego de acción y fantasía oscura con historia, donde el mundo recuerda cada decisión.' }, status: { en: 'Coming soon', es: 'Muy pronto' } },
  { id: 'highlands', title: 'Highlands', kind: 'game', url: 'https://playhighlands.net/', blurb: { en: 'A Web3 farming game with a marketplace, achievements and friends.', es: 'Un juego de granja Web3 con mercado, logros y amigos.' } },
];
export const gameReels = reels.filter(r => r.kind === 'game');
export const webReels = reels.filter(r => r.kind !== 'game');
