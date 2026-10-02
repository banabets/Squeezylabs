import { CatmullRomCurve3, Vector3 } from 'three';
// progress is the curve parameter of each chapter's stop: point index / (points - 1).
export const chapters = [
  { name: 'Arrival', short: 'Arrival', label: 'SQUEEZY LABS / CARIBE VENEZOLANO', title: 'De otro mundo.\nDe aquí.', copy: 'Games, websites, apps and digital experiments.', progress: 0 },
  { name: 'Games', short: 'Games', label: '01 / PLAY IS A SERIOUS THING', title: 'Worlds made\nto be explored.', copy: 'Curiosity is always a good place to start.', progress: .21 },
  { name: 'Web & apps', short: 'Web & apps', label: '02 / MADE TO CONNECT', title: 'Digital, with\na human touch.', copy: 'Digital experiences built to feel alive.', progress: .47 },
  { name: 'Experiments', short: 'Experiments', label: '03 / A LITTLE OUT OF THE ORDINARY', title: 'What if\nwe tried this?', copy: 'Small ideas can become strange things.', progress: .59 },
  { name: 'La bodega', short: 'Bodega', label: '04 / THE CORNER STORE', title: 'La bodega.\nIdeas por encargo.', copy: 'Explora nuestras demos o encarga algo a tu medida.', progress: .82 },
  { name: 'The bigger picture', short: 'Horizon', label: 'SQUEEZY LABS / FROM HERE, TO EVERYWHERE', title: 'Made in Venezuela.\nBuilt for everywhere.', copy: 'Good things start with a little curiosity.', progress: 1 },
];
// Chapter index for a rendered progress value: the nearest stop wins.
export function chapterAt(p: number) {
  for (let i = 0; i < chapters.length - 1; i++) if (p < (chapters[i].progress + chapters[i + 1].progress) / 2) return i;
  return chapters.length - 1;
}
const curve = (a: number[][]) => new CatmullRomCurve3(a.map(p => new Vector3(...p as [number,number,number])), false, 'centripetal');
export const cameraPath = curve([[0,2.65,16],[0,2.65,11],[-3,2.8,7],[-4.8,2.7,4],[-1,2.7,1.5],[2.9,2.7,4.8],[5.5,3.2,5],[8.2,3.8,7],[8.8,3.2,5.8],[9.4,2.5,6.2],[4,18,42],[48,46,72]]);
export const targetPath = curve([[-1,3,-8],[-2,2,0],[-7,2,0],[-7,2,-1],[2,2,-5],[6,1.9,-2.2],[9,1.7,3],[9,1.5,3],[16,2,6],[19,1.9,7.8],[0,2,12],[2,0,4]]);
export const journey = { progress: 0, rendered: 0, reduced: false, paused: false };
export function goTo(progress: number) { window.scrollTo({ top: progress * (document.documentElement.scrollHeight - innerHeight), behavior: journey.reduced ? 'instant' : 'smooth' }); }

