import { useState } from 'react';
import { CONTACT_EMAIL, type Lang } from '../i18n';

// "Encargar proyecto": a two-step brief. Step one collects the project type, a rough budget, timing
// and the idea; step two shows a summary to check before it opens the visitor's email app, addressed
// to the studio with everything filled in.
type Brief = { type: string; budget: string; when: string; date: string; idea: string; name: string; email: string };
const EMPTY: Brief = { type: '', budget: '', when: '', date: '', idea: '', name: '', email: '' };

const COPY = {
  en: {
    type: 'What do you need?', budget: 'Rough budget', when: 'When do you need it?', date: 'Target date (optional)',
    idea: 'Tell us about it', ideaPh: 'Who is it for, what should it do, any links you like…', name: 'Your name', namePh: 'A name to say hello to', email: 'Email',
    next: 'Review my order', reviewTitle: 'Your order, before we write it down', edit: 'Edit', send: 'Send by email',
    sent: 'Your email app should be open with the order ready to send. If it did not open, write to', orWrite: 'Or write to us directly:',
    subject: 'Project order', pick: 'Choose one option',
    types: ['Website', 'Online store', 'App', 'Game', '3D world', 'Something else'],
    budgets: ['Under $500', '$500 – $1,500', '$1,500 – $3,000', '$3,000 – $6,000', 'Over $6,000', 'Not sure yet'],
    whens: ['As soon as possible', 'Within a month', 'In 2–3 months', 'No rush'],
  },
  es: {
    type: '¿Qué necesitas?', budget: 'Presupuesto aproximado', when: '¿Para cuándo lo necesitas?', date: 'Fecha objetivo (opcional)',
    idea: 'Cuéntanos la idea', ideaPh: 'Para quién es, qué debe hacer, enlaces que te gusten…', name: 'Tu nombre', namePh: 'Un nombre para saludarte', email: 'Correo',
    next: 'Revisar mi encargo', reviewTitle: 'Tu encargo, antes de anotarlo', edit: 'Editar', send: 'Enviar por correo',
    sent: 'Se debería haber abierto tu correo con el encargo listo. Si no se abrió, escríbenos a', orWrite: 'O escríbenos directo:',
    subject: 'Encargo de proyecto', pick: 'Elige una opción',
    types: ['Página web', 'Tienda en línea', 'App', 'Juego', 'Mundo 3D', 'Otra cosa'],
    budgets: ['Menos de $500', '$500 – $1.500', '$1.500 – $3.000', '$3.000 – $6.000', 'Más de $6.000', 'Aún no sé'],
    whens: ['Lo antes posible', 'En un mes', 'En 2–3 meses', 'Sin apuro'],
  },
};

function Chips({ name, label, options, value, onChange }: { name: string; label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return <fieldset className="chips"><legend>{label}</legend>
    {options.map((o, i) => <label key={o} className={value === o ? 'on' : ''}><input type="radio" name={name} value={o} checked={value === o} onChange={() => onChange(o)} required={i === 0} />{o}</label>)}
  </fieldset>;
}

export function BriefForm({ lang }: { lang: Lang }) {
  const t = COPY[lang], [b, setB] = useState<Brief>(EMPTY), [step, setStep] = useState<'form' | 'review'>('form'), [sent, setSent] = useState(false);
  const set = (k: keyof Brief) => (v: string) => setB(x => ({ ...x, [k]: v }));
  const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
  const dateText = b.date ? new Date(b.date + 'T12:00').toLocaleDateString(lang === 'es' ? 'es' : 'en', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const rows: [string, string][] = [[t.type, b.type], [t.budget, b.budget], [t.when, b.when + (dateText ? ` · ${dateText}` : '')], [t.name, `${b.name} · ${b.email}`], [t.idea, b.idea]];
  const send = () => {
    const body = rows.map(([k, v]) => `${k}\n${v}`).join('\n\n');
    location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${t.subject}: ${b.type} — ${b.name}`)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  if (step === 'review') return <div className="brief-review">
    <h3>{t.reviewTitle}</h3>
    <dl>{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
    <div className="item-row"><button className="pill" type="button" onClick={send}>{t.send} <span>↗</span></button><button className="text-button dark" type="button" onClick={() => { setStep('form'); setSent(false); }}>{t.edit}</button></div>
    {sent && <p role="status" className="success">{t.sent} {mail}.</p>}
  </div>;

  return <form className="brief" onSubmit={e => { e.preventDefault(); setStep('review'); }}>
    <Chips name="type" label={t.type} options={t.types} value={b.type} onChange={set('type')} />
    <Chips name="budget" label={t.budget} options={t.budgets} value={b.budget} onChange={set('budget')} />
    <Chips name="when" label={t.when} options={t.whens} value={b.when} onChange={set('when')} />
    <label>{t.date}<input type="date" value={b.date} min={new Date().toISOString().slice(0, 10)} onChange={e => set('date')(e.target.value)} /></label>
    <label>{t.idea}<textarea required rows={3} value={b.idea} placeholder={t.ideaPh} onChange={e => set('idea')(e.target.value)} /></label>
    <div className="brief-pair">
      <label>{t.name}<input autoComplete="name" required value={b.name} placeholder={t.namePh} onChange={e => set('name')(e.target.value)} /></label>
      <label>{t.email}<input type="email" autoComplete="email" required value={b.email} placeholder="you@example.com" onChange={e => set('email')(e.target.value)} /></label>
    </div>
    <button className="pill" type="submit">{t.next} <span>→</span></button>
    <p className="direct-mail">{t.orWrite} {mail}</p>
  </form>;
}
