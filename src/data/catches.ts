// What you can fish off the pier: each catch points to a real part of the site.
export type Catch = { fish: string; color: string; text: string; label: string; open: string };
export const CATCHES: Catch[] = [
  { fish: 'un pargo rojo', color: '#d24a3a', text: 'Viene con la bodega: plantillas y encargos a tu medida.', label: 'Ir a la bodega', open: 'shop' },
  { fish: 'un carite', color: '#7d9bb0', text: 'Viene con el arcade: ¿cuántos mangos atrapas en 30 segundos?', label: 'Jugar', open: 'games' },
  { fish: 'un jurel dorado', color: '#e6b230', text: 'Viene con el laboratorio: ideas pequeñas que se vuelven cosas raras.', label: 'Ver experimentos', open: 'experiments' },
  { fish: 'un mero', color: '#6f7f5a', text: 'Viene con una conversación: cuéntanos qué quieres construir.', label: 'Escribirnos', open: 'contact' },
];
export const CATCH_EVENT = 'squeezy:catch';
