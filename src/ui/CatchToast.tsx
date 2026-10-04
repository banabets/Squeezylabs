import { useEffect, useState } from 'react';
import { CATCHES, CATCH_EVENT } from '../data/catches';
import { useLang } from '../i18n';

/** Shows what was fished off the pier, with a shortcut to that part of the site. */
export function CatchToast({ onOpen }: { onOpen: (name: string) => void }) {
  const lang = useLang();
  const [index, setIndex] = useState<number | null>(null);
  useEffect(() => {
    let timer = 0;
    const show = (e: Event) => { setIndex((e as CustomEvent<number>).detail); clearTimeout(timer); timer = window.setTimeout(() => setIndex(null), 8000); };
    window.addEventListener(CATCH_EVENT, show);
    return () => { window.removeEventListener(CATCH_EVENT, show); clearTimeout(timer); };
  }, []);
  if (index === null) return null;
  const c = CATCHES[index];
  return <div className="catch-toast" role="status">
    <span className="catch-fish" style={{ background: c.color }} aria-hidden="true" />
    <div><b>{lang === 'es' ? '¡Pescaste ' : 'You caught '}{c.fish[lang]}!</b><p>{c.text[lang]}</p></div>
    <button className="pill" onClick={() => { setIndex(null); onOpen(c.open); }}>{c.label[lang]} ↗</button>
    <button className="catch-close" onClick={() => setIndex(null)} aria-label={lang === 'es' ? 'Cerrar' : 'Close'}>×</button>
  </div>;
}
