// Seção 11 e 19.9 item 7 — "Quem está com Os Argonautas" precisa estar
// sempre visível, em qualquer breakpoint, sem exigir um toque.

import type { EstadoVisivel } from '@olympos/motor';

export function IndicadorArgonautas({ estadoVisivel }: { estadoVisivel: EstadoVisivel }) {
  const dono = estadoVisivel.argonautas.dono
    ? estadoVisivel.jogadores.find((j) => j.id === estadoVisivel.argonautas.dono)
    : null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-900/60 px-3 py-2 text-sm">
      <span className="text-base" aria-hidden="true">
        ⛵
      </span>
      <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">Os Argonautas</span>
      {dono ? (
        <span className="text-stone-100">
          {dono.avatar} {dono.nome} <span className="text-stone-500">({dono.simbolosArgo} símbolos)</span>
        </span>
      ) : (
        <span className="text-stone-500">ninguém ainda — mínimo de 3 símbolos</span>
      )}
    </div>
  );
}
