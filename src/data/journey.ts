import { CatmullRomCurve3, Vector3 } from 'three';
// progress is the curve parameter of each chapter's stop: point index / (points - 1).
// The site opens at the bodega in golden afternoon light, then walks the studio from east to west
// (web & apps, games; the experiments stop is off for now) and ends on the west beach at sunset, close to the ground so
// nothing is lost to distance (the old high aerial horizon thinned foliage and fogged the island).
export const chapters = [
  { name: 'La bodega', progress: 0,
    short: { en: 'Bodega', es: 'Bodega' },
    label: { en: 'SQUEEZY LABS / SOMEWHERE IN THE CARIBBEAN', es: 'SQUEEZY LABS / EN ALGÚN LUGAR DEL CARIBE' },
    title: { en: 'La bodega.\nIdeas made to order.', es: 'La bodega.\nIdeas por encargo.' },
    copy: { en: 'Games, websites, apps and digital experiments, made somewhere in the Caribbean.', es: 'Juegos, webs, apps y experimentos digitales, hechos en algún lugar del Caribe.' } },
  { name: 'Web & apps', progress: 3 / 7,
    short: { en: 'Web & apps', es: 'Webs y apps' },
    label: { en: '02 / MADE TO CONNECT', es: '02 / HECHO PARA CONECTAR' },
    title: { en: 'Digital, with\na human touch.', es: 'Digital, con\ntoque humano.' },
    copy: { en: 'Digital experiences built to feel alive.', es: 'Experiencias digitales hechas para sentirse vivas.' } },
  { name: 'Games', progress: 5 / 7,
    short: { en: 'Games', es: 'Juegos' },
    label: { en: '03 / PLAY IS A SERIOUS THING', es: '03 / JUGAR ES COSA SERIA' },
    title: { en: 'Worlds made\nto be explored.', es: 'Mundos hechos\npara explorar.' },
    copy: { en: 'Curiosity is always a good place to start.', es: 'La curiosidad siempre es un buen punto de partida.' } },
  { name: 'The bigger picture', progress: 1,
    short: { en: 'Let’s talk', es: 'Hablemos' },
    label: { en: 'SQUEEZY LABS / FROM HERE, TO EVERYWHERE', es: 'SQUEEZY LABS / DESDE AQUÍ, PARA TODOS LADOS' },
    title: { en: 'Made in the Caribbean.\nBuilt for everywhere.', es: 'Hecho en el Caribe.\nPara todo el mundo.' },
    copy: { en: 'Good things start with a little curiosity.', es: 'Lo bueno empieza con un poquito de curiosidad.' } },
];
// Chapter index for a rendered progress value: the nearest stop wins.
export function chapterAt(p: number) {
  for (let i = 0; i < chapters.length - 1; i++) if (p < (chapters[i].progress + chapters[i + 1].progress) / 2) return i;
  return chapters.length - 1;
}
const curve = (a: number[][]) => new CatmullRomCurve3(a.map(p => new Vector3(...p as [number,number,number])), false, 'centripetal');
// Stops: bodega (0), web & apps (3), games (5), sunset on the west beach (7).
export const cameraPath = curve([[9.2,2.9,6.4],[11.4,3.2,5],[6.5,3.3,5.8],[2.9,2.7,4.8],[-1,2.7,3.5],[-3,2.8,7],[-9,2.3,9.5],[-15.5,1.7,6.5]]);
export const targetPath = curve([[19.5,1.95,7.3],[11,1.8,-8],[7.5,1.8,0],[6,1.9,-2.2],[-3,2,-1],[-7,2,0],[-18,2.4,6],[-40,3.2,9]]);
export const journey = { progress: 0, rendered: 0, reduced: false, paused: false };
export function goTo(progress: number) { window.scrollTo({ top: progress * (document.documentElement.scrollHeight - innerHeight), behavior: journey.reduced ? 'instant' : 'smooth' }); }

