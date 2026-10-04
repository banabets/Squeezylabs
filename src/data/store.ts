import type { Lang, Tx } from '../i18n';
// Bodega catalog. The same entries drive the 3D packages on the shelf and the HTML cards.
// Product names and prices are placeholders until real products are approved.
export type Pack = { bg: string; fg: string; top: string; t1: string; t2: string; sub: string };
export type StoreItem = {
  kind: 'product' | 'house' | 'hire';
  type: Tx;
  name: Tx;
  price?: number;
  desc: Tx;
  pack?: Pack;
};
const same = (s: string): Tx => ({ en: s, es: s });

export const storeItems: Record<string, StoreItem> = {
  p1: { kind: 'product', type: { en: 'Digital product · template', es: 'Producto digital · plantilla' }, name: same('Landing Kit Caribe'), price: 29, desc: { en: 'A React landing page template: six sections, dark mode and copy in English and Spanish, ready to edit.', es: 'Plantilla de landing en React: seis secciones, modo oscuro y textos en español e inglés, lista para editar.' }, pack: { bg: '#0f6f6a', fg: '#fff3c4', top: 'SQUEEZY LABS', t1: 'Landing Kit', t2: 'Caribe', sub: 'Web template · React' } },
  p2: { kind: 'product', type: { en: 'Digital product · icons', es: 'Producto digital · íconos' }, name: same('Costa Icons'), price: 12, desc: { en: '120 hand-drawn icons: palms, peñeros, arepas, mangos and araguaney trees. SVG and PNG.', es: '120 íconos dibujados a mano: palmas, peñeros, arepas, mangos y araguaneyes. SVG y PNG.' }, pack: { bg: '#e86a4a', fg: '#fff6ea', top: 'SQUEEZY LABS', t1: 'Costa', t2: 'Icons', sub: '120 icons · SVG' } },
  p3: { kind: 'product', type: { en: 'Digital product · game', es: 'Producto digital · juego' }, name: { en: 'Peñero, the game', es: 'Peñero, el juego' }, price: 4, desc: { en: 'A short game about sailing between cays. Free demo in the browser; full version for PC.', es: 'Un juego corto sobre navegar entre cayos. Demo gratis en el navegador; versión completa para PC.' }, pack: { bg: '#173a6b', fg: '#ffd27a', top: 'SQUEEZY GAMES', t1: 'Peñero', t2: 'the game', sub: 'PC & browser' } },
  p4: { kind: 'product', type: { en: 'Digital product · audio', es: 'Producto digital · audio' }, name: same('Shoreline Sounds'), price: 9, desc: { en: '40 sounds recorded on the coast: waves, breeze, guacharacas and a peñero engine.', es: '40 sonidos grabados en la costa: olas, brisa, guacharacas y un motor de peñero.' }, pack: { bg: '#bfe3d3', fg: '#10302e', top: 'SQUEEZY LABS', t1: 'Shoreline', t2: 'Sounds', sub: '40 sounds · WAV' } },
  harina: { kind: 'house', type: { en: 'On the house', es: 'Cortesía de la casa' }, name: same('Harina P.A.N.'), desc: { en: 'Not for sale. It is what keeps us going: arepas before every delivery.', es: 'No se vende. Es lo que nos mantiene: arepas antes de cada entrega.' } },
  polarcita: { kind: 'house', type: { en: 'On the house', es: 'Cortesía de la casa' }, name: { en: 'Ice-cold polarcitas', es: 'Polarcitas bien frías' }, desc: { en: 'Not for sale either. They are on the house the day we deliver your project.', es: 'Tampoco se venden. Van por la casa el día que entregamos tu proyecto.' } },
  libreta: { kind: 'hire', type: { en: 'Custom work', es: 'Por encargo' }, name: same('La libreta'), desc: { en: 'Write down what you need and we reply within 48 hours with scope and a quote.', es: 'Anota lo que necesitas y te respondemos en 48 horas con alcance y presupuesto.' } },
  pizarra: { kind: 'hire', type: { en: 'Custom work', es: 'Por encargo' }, name: { en: 'Today’s orders', es: 'Encargos del día' }, desc: { en: 'Express website from $450, app from $1,800, custom game from $2,500, 3D world from $3,000.', es: 'Web exprés desde $450, app desde $1.800, juego a medida desde $2.500, mundo 3D desde $3.000.' } },
};

export const productKeys = ['p1', 'p2', 'p3', 'p4'];

export const services: { name: Tx; price: Tx; note: Tx }[] = [
  { name: { en: 'Express website', es: 'Web exprés' }, price: { en: 'from $450', es: 'desde $450' }, note: { en: 'A page that sells, live in a week.', es: 'Una página que vende, en línea en una semana.' } },
  { name: { en: 'Website + store', es: 'Web + tienda' }, price: { en: 'from $1,200', es: 'desde $1.200' }, note: { en: 'Catalog, payments and a dashboard.', es: 'Catálogo, pagos y panel de control.' } },
  { name: { en: 'App', es: 'App' }, price: { en: 'from $1,800', es: 'desde $1.800' }, note: { en: 'iOS and Android from one codebase.', es: 'iOS y Android con un solo código.' } },
  { name: { en: 'Custom game', es: 'Juego a medida' }, price: { en: 'from $2,500', es: 'desde $2.500' }, note: { en: 'Promotional, educational or for stores.', es: 'Promocional, educativo o para tiendas.' } },
  { name: { en: '3D world like this one', es: 'Mundo 3D como este' }, price: { en: 'from $3,000', es: 'desde $3.000' }, note: { en: 'A brand experience people explore.', es: 'Una experiencia de marca para explorar.' } },
];

export const money = (n: number, lang: Lang = 'en') => '$' + n.toLocaleString(lang === 'es' ? 'es-VE' : 'en-US');
