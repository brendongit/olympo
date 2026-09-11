// Seção 17.5/19 — feed narrativo lateral, aria-live="polite". Só lê o log
// persistente da store (já traduzido por narrarEvento) — nenhuma lógica de
// regra aqui.

import { usePartida } from '../loja/usePartida.js';
import { narrarEvento } from '../lib/eventos.js';

export function FeedDeEventos() {
  const feed = usePartida((s) => s.feed);
  const jogadores = usePartida((s) => s.estadoVisivel?.jogadores ?? []);

  if (feed.length === 0) return null;

  return (
    <div className="flex max-h-32 shrink-0 flex-col gap-1 overflow-y-auto rounded-lg border border-stone-800 bg-stone-900/60 p-2 text-xs">
      <h3 className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Feed</h3>
      <ul aria-live="polite" className="flex flex-col gap-1">
        {[...feed]
          .slice(-15)
          .reverse()
          .map((item) => (
            <li key={item.id} className="text-stone-400">
              {narrarEvento(item.evento, jogadores)}
            </li>
          ))}
      </ul>
    </div>
  );
}
