// Seção 19.8/20 — botão de engrenagem no cabeçalho abrindo um popover
// pequeno com "Animações reduzidas" e "Alto contraste". Persistido em
// localStorage via usePreferencias — não é estado de partida.

import { useState } from 'react';
import { useFecharComEsc } from '../lib/useFecharComEsc.js';
import { usePreferencias } from '../loja/usePreferencias.js';

export function PainelPreferencias() {
  const [aberto, setAberto] = useState(false);
  const animacoesReduzidas = usePreferencias((s) => s.animacoesReduzidas);
  const altoContraste = usePreferencias((s) => s.altoContraste);
  const alternarAnimacoesReduzidas = usePreferencias((s) => s.alternarAnimacoesReduzidas);
  const alternarAltoContraste = usePreferencias((s) => s.alternarAltoContraste);

  useFecharComEsc(() => setAberto(false));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label="Preferências de acessibilidade"
        aria-expanded={aberto}
        className="flex h-8 w-8 items-center justify-center rounded text-stone-400 hover:bg-stone-800 hover:text-stone-200"
      >
        ⚙
      </button>

      {aberto && (
        <div
          role="dialog"
          aria-label="Preferências"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-stone-700 bg-stone-900 p-3 shadow-2xl"
        >
          <label className="mb-2 flex items-center justify-between gap-2 text-xs text-stone-300">
            Animações reduzidas
            <input
              type="checkbox"
              checked={animacoesReduzidas === 'sempre'}
              onChange={alternarAnimacoesReduzidas}
              className="h-4 w-4"
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-xs text-stone-300">
            Alto contraste (padrões)
            <input type="checkbox" checked={altoContraste} onChange={alternarAltoContraste} className="h-4 w-4" />
          </label>
        </div>
      )}
    </div>
  );
}
