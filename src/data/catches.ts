import type { Tx } from '../i18n';
// What you can fish off the pier: each catch points to a real part of the site.
export type Catch = { fish: Tx; color: string; text: Tx; label: Tx; open: string };
export const CATCHES: Catch[] = [
  { fish: { es: 'un pargo rojo', en: 'a red snapper' }, color: '#d24a3a', text: { es: 'Viene con la bodega: plantillas y encargos a tu medida.', en: 'It comes with the bodega: templates and made-to-order work.' }, label: { es: 'Ir a la bodega', en: 'Visit the bodega' }, open: 'shop' },
  { fish: { es: 'un carite', en: 'a king mackerel' }, color: '#7d9bb0', text: { es: 'Viene con el arcade: ¿cuántos mangos atrapas en 30 segundos?', en: 'It comes with the arcade: how many mangos can you catch in 30 seconds?' }, label: { es: 'Jugar', en: 'Play' }, open: 'games' },
  { fish: { es: 'un jurel dorado', en: 'a golden jack' }, color: '#e6b230', text: { es: 'Viene con el taller: webs y apps que la gente usa todos los días.', en: 'It comes with the workshop: websites and apps people use every day.' }, label: { es: 'Ver proyectos', en: 'See projects' }, open: 'web' },
  { fish: { es: 'un mero', en: 'a grouper' }, color: '#6f7f5a', text: { es: 'Viene con una conversación: cuéntanos qué quieres construir.', en: 'It comes with a conversation: tell us what you want to build.' }, label: { es: 'Escribirnos', en: 'Write to us' }, open: 'contact' },
];
export const CATCH_EVENT = 'squeezy:catch';
