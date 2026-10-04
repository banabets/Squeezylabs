import { useEffect, useState } from 'react';
import type { Lang } from '../i18n';

// Caribbean facts that rotate on the loading screen while the world downloads.
const FACTS: Record<Lang, string[]> = {
  es: [
    'Las playas de arena blanca del Caribe se deben en buena parte al pez loro: muerde el coral y lo devuelve convertido en arena.',
    'El mar Caribe tiene unos 2,75 millones de km² y más de 7.000 islas, islotes, arrecifes y cayos.',
    'El mango no es caribeño: llegó desde el sur de Asia y hoy es la fruta de cada patio.',
    'Un coco puede flotar meses en el mar y aun así germinar en la playa donde llegue.',
    'Los flamencos son rosados por lo que comen: algas y camaroncitos llenos de carotenoides.',
    'Los pelícanos pardos pescan lanzándose en picada al agua desde más de diez metros de altura.',
    'El Sistema Arrecifal Mesoamericano, en el Caribe occidental, es el arrecife más grande de las Américas.',
    'La temporada de huracanes del Atlántico va de junio a noviembre.',
  ],
  en: [
    'The Caribbean’s white beaches owe a lot to the parrotfish: it bites off coral and passes it out as sand.',
    'The Caribbean Sea covers about 2.75 million km² and holds more than 7,000 islands, islets, reefs and cays.',
    'Mangos are not from here: they came from South Asia, and now there is one in every backyard.',
    'A coconut can drift at sea for months and still sprout on whatever beach it reaches.',
    'Flamingos are pink because of what they eat: algae and tiny shrimp full of carotenoids.',
    'Brown pelicans fish by plunging into the water from more than ten meters up.',
    'The Mesoamerican Reef, in the western Caribbean, is the largest reef system in the Americas.',
    'The Atlantic hurricane season runs from June to November.',
  ],
};

export function LoaderFacts({ lang }: { lang: Lang }) {
  const [i, setI] = useState(() => Math.floor(Math.random() * FACTS.en.length));
  useEffect(() => { const id = setInterval(() => setI(n => (n + 1) % FACTS.en.length), 4800); return () => clearInterval(id); }, []);
  return <div className="loader-fact" aria-live="polite">
    <small>{lang === 'es' ? '¿Sabías que…?' : 'Did you know?'}</small>
    <p key={i + lang}>{FACTS[lang][i]}</p>
  </div>;
}
