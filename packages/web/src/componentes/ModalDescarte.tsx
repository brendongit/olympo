// Seção 8 / 17.6 — sub-fase DESCARTANDO. Overlay bloqueante: o turno não
// avança enquanto o excedente não for devolvido (garantido pelo motor, não
// por este componente — aqui só montamos a ação e checamos podeDevolver).

import { useState } from 'react';
import type { Bolsa, EstadoVisivel } from '@olympos/motor';
import { podeDevolver } from '@olympos/motor';
import { INFO_FICHA, ORDEM_FICHAS } from '../lib/tema.js';
import { usePartida } from '../loja/usePartida.js';

export function ModalDescarte({ estadoVisivel }: { estadoVisivel: EstadoVisivel }) {
  const despachar = usePartida((s) => s.despachar);
  const pendente = estadoVisivel.descartePendente!;
  const jogador = estadoVisivel.jogadores.find((j) => j.id === pendente.jogadorId)!;
  const [selecionadas, setSelecionadas] = useState<Partial<Bolsa>>({});

  const total = ORDEM_FICHAS.reduce((acc, f) => acc + (selecionadas[f] ?? 0), 0);
  const resultado = podeDevolver(estadoVisivel, jogador.id, selecionadas);

  function ajustar(f: (typeof ORDEM_FICHAS)[number], delta: number) {
    setSelecionadas((atual) => {
      const atualQtd = atual[f] ?? 0;
      const novaQtd = Math.max(0, Math.min(jogador.fichas[f], atualQtd + delta));
      return { ...atual, [f]: novaQtd };
    });
  }

  function confirmar() {
    despachar({ tipo: 'DEVOLVER_FICHAS', jogadorId: jogador.id, fichas: selecionadas });
    setSelecionadas({});
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-red-800 bg-stone-900 p-6 shadow-2xl">
        <h2 className="mb-1 text-xl font-bold text-red-300">
          {jogador.nome}, devolva {pendente.excedente} essência{pendente.excedente > 1 ? 's' : ''}
        </h2>
        <p className="mb-4 text-sm text-stone-400">
          Limite de 10 essências ao fim do turno (Seção 8). Escolha o que devolver.
        </p>

        <div className="mb-4 flex flex-col gap-2">
          {ORDEM_FICHAS.filter((f) => jogador.fichas[f] > 0).map((f) => {
            const info = INFO_FICHA[f];

            // A Essência de Chronos nunca pode ser devolvida (Seção 8, casos
            // de borda 7 e 8) — o seletor precisa exibi-la travada, com o motivo.
            if (f === 'chronos') {
              return (
                <div key={f} className="flex items-center gap-2 opacity-70">
                  <span className={`flex w-24 items-center gap-1 rounded px-2 py-1 text-sm ${info.corFundo} ${info.corTexto}`}>
                    {info.icone} {info.rotulo}
                  </span>
                  <span className="flex-1 text-xs text-stone-400">
                    🔒 a Essência de Chronos não pode ser devolvida
                  </span>
                </div>
              );
            }

            const qtd = selecionadas[f] ?? 0;
            return (
              <div key={f} className="flex items-center gap-2">
                <span className={`flex w-24 items-center gap-1 rounded px-2 py-1 text-sm ${info.corFundo} ${info.corTexto}`}>
                  {info.icone} {info.rotulo}
                </span>
                <button
                  type="button"
                  onClick={() => ajustar(f, -1)}
                  disabled={qtd <= 0}
                  className="h-7 w-7 rounded bg-stone-700 text-stone-100 disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-10 text-center font-semibold">
                  {qtd}/{jogador.fichas[f]}
                </span>
                <button
                  type="button"
                  onClick={() => ajustar(f, 1)}
                  disabled={qtd >= jogador.fichas[f]}
                  className="h-7 w-7 rounded bg-stone-700 text-stone-100 disabled:opacity-30"
                >
                  +
                </button>
              </div>
            );
          })}
        </div>

        <p
          className={`mb-3 text-center text-sm font-semibold ${
            total === pendente.excedente ? 'text-green-400' : 'text-stone-400'
          }`}
        >
          selecionado {total}/{pendente.excedente}
        </p>

        <button
          type="button"
          disabled={!resultado.ok}
          title={resultado.ok ? undefined : resultado.motivo}
          onClick={confirmar}
          className={`w-full rounded-lg py-2 font-semibold ${
            resultado.ok
              ? 'bg-amber-500 text-stone-950 hover:bg-amber-400'
              : 'cursor-not-allowed bg-stone-800 text-stone-600'
          }`}
        >
          Confirmar devolução
        </button>
      </div>
    </div>
  );
}
