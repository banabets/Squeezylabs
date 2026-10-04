import { useSyncExternalStore } from 'react';
// Site language. English by default; the visitor can switch to Spanish and the choice is remembered.
export type Lang = 'en' | 'es';
export type Tx = Record<Lang, string>;
const KEY = 'squeezy-lang';
const initial = (): Lang => {
  try { const saved = localStorage.getItem(KEY); if (saved === 'en' || saved === 'es') return saved; } catch { /* storage unavailable */ }
  return 'en';
};
let current: Lang = initial();
const listeners = new Set<() => void>();
const apply = () => { document.documentElement.lang = current; };
apply();
export function setLang(l: Lang) {
  current = l; apply();
  try { localStorage.setItem(KEY, l); } catch { /* storage unavailable */ }
  listeners.forEach(f => f());
}
export const getLang = () => current;
export function useLang() {
  return useSyncExternalStore(f => { listeners.add(f); return () => { listeners.delete(f); }; }, getLang);
}
export const CONTACT_EMAIL = 'support@squeezy.lat';
