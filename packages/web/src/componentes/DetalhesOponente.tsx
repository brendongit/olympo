// Seção 16 — bloco de informação pública de UM oponente. Extraído para ser
// reaproveitado tanto na coluna lateral do desktop (Seção 17.3) quanto na
// bottom-sheet de oponente do mobile (Seção 17.4 item 4).

import type { JogadorVisivel } from '@olympos/motor';
import { LENDA_POR_ID } from '@olympos/motor';
import { INFO_FICHA, ORDEM_ESSENCIAS, ORDEM_FICHAS } from '../lib/tema.js';

export function DetalhesOponente({ jogador: j }: { jogador: JogadorVisivel }) {
  return (
    <>
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1 font-serif font-semibold text-stone-100">
          <span>{j.avatar}</span>
          {j.nome}
          {!j.conectado && <span className="text-stone-600">(offline)</span>}
        </span>
        <span className="text-sm font-bold text-amber-300">{j.kleos}★</span>
      </div>

      <div className="mb-1 flex flex-wrap gap-1">
        {ORDEM_FICHAS.map((f) => {
          const q = j.fichas[f];
          if (q === 0) return null;
          const info = INFO_FICHA[f];
          return (
            <span
              key={f}
              className={`flex items-center gap-0.5 rounded px-1 text-[10px] ${info.corFundo} ${info.corTexto}`}
              title={info.rotulo}
            >
              {info.icone}
              {q}
            </span>
          );
        })}
        <span className="text-[10px] text-stone-500">
          ({Object.values(j.fichas).reduce((a, b) => a + b, 0)}/10)
        </span>
      </div>

      <div className="mb-1 flex flex-wrap gap-1">
        {ORDEM_ESSENCIAS.filter((e) => j.dominios[e] > 0).map((e) => {
          const info = INFO_FICHA[e];
          return (
            <span
              key={e}
              className="flex items-center gap-0.5 rounded bg-stone-800 px-1 text-[10px] text-stone-300"
              title={`Domínio ${info.rotulo}`}
            >
              {info.icone}
              {j.dominios[e]}
            </span>
          );
        })}
        {j.deuses.length > 0 && <span className="text-[10px] text-amber-400">⛩ ×{j.deuses.length}</span>}
      </div>

      {j.pressagios.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {j.pressagios.map((p, idx) => (
            <span
              key={idx}
              className="rounded border border-stone-700 bg-stone-800 px-1 text-[10px] text-stone-400"
              title={p.oculto ? `Presságio oculto (nível ${p.nivel})` : (LENDA_POR_ID[p.cartaId!]?.nome ?? p.cartaId!)}
            >
              {p.oculto ? `🂠 nv.${p.nivel}` : (LENDA_POR_ID[p.cartaId!]?.nome ?? p.cartaId)}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
