// Clips shown on the studio screens. To show a real project, drop a short muted .mp4 in
// public/projects/ and set `video: '/projects/name.mp4'`. Until then each screen plays an
// animated mock-up labeled as a demo; no project here is presented as shipped work.
export type Reel = { title: string; kind: 'game' | 'web' | 'app'; video?: string };
export const reels: Reel[] = [
  { title: 'Tu web aquí', kind: 'web' },
  { title: 'Tu juego aquí', kind: 'game' },
  { title: 'Tu app aquí', kind: 'app' },
];
