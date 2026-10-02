import { CatmullRomCurve3, Vector3 } from 'three';
export const chapters = [
  { name: 'Arrival', label: 'A SMALL STUDIO. A WORLD OF POSSIBILITIES.', title: 'A little latitude\nfor big ideas.', copy: 'Games, websites, apps and digital experiments.', progress: 0 },
  { name: 'Games', label: '01 / PLAY IS A SERIOUS THING', title: 'Worlds made\nto be explored.', copy: 'Curiosity is always a good place to start.', progress: .23 },
  { name: 'Web & apps', label: '02 / MADE TO CONNECT', title: 'Digital, with\na human touch.', copy: 'Digital experiences built to feel alive.', progress: .52 },
  { name: 'Experiments', label: '03 / A LITTLE OUT OF THE ORDINARY', title: 'What if\nwe tried this?', copy: 'Small ideas can become strange things.', progress: .65 },
  { name: 'The bigger picture', label: 'SQUEEZY LABS / FROM HERE, TO EVERYWHERE', title: 'Made in Venezuela.\nBuilt for everywhere.', copy: 'Good things start with a little curiosity.', progress: 1 },
];
const curve = (a: number[][]) => new CatmullRomCurve3(a.map(p => new Vector3(...p as [number,number,number])), false, 'centripetal');
export const cameraPath = curve([[0,3.2,16],[0,3,11],[-3,2.8,7],[-4.8,2.7,4],[-1,2.7,1.5],[2.9,2.7,4.8],[5.5,3.2,5],[9,5,8],[11,10,15],[21,20,30],[35,29,50]]);
export const targetPath = curve([[-1,3,-8],[-2,2,0],[-7,2,0],[-7,2,-1],[2,2,-5],[6,1.9,-2.2],[9,1.7,3],[9,1.5,3],[0,1,0],[0,0,0],[0,0,-5]]);
export const journey = { progress: 0, rendered: 0, reduced: false, paused: false };
export function goTo(progress: number) { window.scrollTo({ top: progress * (document.documentElement.scrollHeight - innerHeight), behavior: journey.reduced ? 'instant' : 'smooth' }); }
