// Bodega catalog. The same entries drive the 3D packages on the shelf and the HTML cards.
// Product names and prices are placeholders until real products are approved.
export type Pack = { bg: string; fg: string; top: string; t1: string; t2: string; sub: string };
export type StoreItem = {
  kind: 'product' | 'house' | 'hire';
  type: string;
  name: string;
  price?: number;
  desc: string;
  pack?: Pack;
};

export const storeItems: Record<string, StoreItem> = {
  p1: { kind: 'product', type: 'Digital product · template', name: 'Landing Kit Caribe', price: 29, desc: 'A React landing page template: six sections, dark mode and copy in English and Spanish, ready to edit.', pack: { bg: '#0f6f6a', fg: '#fff3c4', top: 'SQUEEZY LABS', t1: 'Landing Kit', t2: 'Caribe', sub: 'Web template · React' } },
  p2: { kind: 'product', type: 'Digital product · icons', name: 'Costa Icons', price: 12, desc: '120 hand-drawn icons: palms, peñeros, arepas, mangos and araguaney trees. SVG and PNG.', pack: { bg: '#e86a4a', fg: '#fff6ea', top: 'SQUEEZY LABS', t1: 'Costa', t2: 'Icons', sub: '120 icons · SVG' } },
  p3: { kind: 'product', type: 'Digital product · game', name: 'Peñero, the game', price: 4, desc: 'A short game about sailing between cays. Free demo in the browser; full version for PC.', pack: { bg: '#173a6b', fg: '#ffd27a', top: 'SQUEEZY GAMES', t1: 'Peñero', t2: 'the game', sub: 'PC & browser' } },
  p4: { kind: 'product', type: 'Digital product · audio', name: 'Shoreline Sounds', price: 9, desc: '40 sounds recorded on the coast: waves, breeze, guacharacas and a peñero engine.', pack: { bg: '#bfe3d3', fg: '#10302e', top: 'SQUEEZY LABS', t1: 'Shoreline', t2: 'Sounds', sub: '40 sounds · WAV' } },
  harina: { kind: 'house', type: 'On the house', name: 'Harina P.A.N.', desc: 'Not for sale. It is what keeps us going: arepas before every delivery.' },
  polarcita: { kind: 'house', type: 'On the house', name: 'Ice-cold polarcitas', desc: 'Not for sale either. They are on the house the day we deliver your project.' },
  libreta: { kind: 'hire', type: 'Custom work', name: 'La libreta', desc: 'Write down what you need and we reply within 48 hours with scope and a quote.' },
  pizarra: { kind: 'hire', type: 'Custom work', name: 'Today’s orders', desc: 'Express website from $450, app from $1,800, custom game from $2,500, 3D world from $3,000.' },
};

export const productKeys = ['p1', 'p2', 'p3', 'p4'];

export const services = [
  { name: 'Express website', price: 'from $450', note: 'A page that sells, live in a week.' },
  { name: 'Website + store', price: 'from $1,200', note: 'Catalog, payments and a dashboard.' },
  { name: 'App', price: 'from $1,800', note: 'iOS and Android from one codebase.' },
  { name: 'Custom game', price: 'from $2,500', note: 'Promotional, educational or for stores.' },
  { name: '3D world like this one', price: 'from $3,000', note: 'A brand experience people explore.' },
];

export const money = (n: number) => '$' + n.toLocaleString('en-US');
