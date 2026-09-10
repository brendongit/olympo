// Ações A e B (Seção 7.1/7.2). Toda decisão de legalidade vem de
// podeColherDiferentes/podeColherIguais — este componente só junta cliques
// numa seleção e despacha quando ela fica completa.

import { useEffect, useState } from 'react';
import type { Essencia, EstadoJogo } from '@olympos/motor';
import { podeColherDiferentes, podeColherIguais } from '@olympos/motor';
import { INFO_FICHA, ORDEM_FICHAS } from '../lib/tema.js';
import { usePartida } from '../loja/usePartida.js';

export function Reservatorio({ estado }: { estado: EstadoJogo }) {
  const despachar = usePartida((s) => s.despachar);
  const [selecionadas, setSelecionadas] = useState<Essencia[]>([]);
  const jogadorId = estado.jogadores[estado.jogadorAtual]!.id;

  const disponiveis = (['eter', 'oceano', 'terra', 'chama', 'sombra'] as const).filter(
    (e) => estado.reservatorio[e] > 0,
  );
  const maximo = Math.min(3, disponiveis.length);

  useEffect(() => {
    if (maximo > 0 && selecionadas.length === maximo) {
      despachar({ tipo: 'COLHER_DIFERENTES', jogadorId, essencias: selecionadas });
      setSelecionadas([]);
    }
  }, [selecionadas, maximo, jogadorId, despachar]);

  const emEscolhendoAcao = estado.subFase === 'ESCOLHENDO_ACAO';

  function alternar(e: Essencia) {
    if (!emEscolhendoAcao) return;
    setSelecionadas((atual) => {
      if (atual.includes(e)) return atual.filter((x) => x !== e);
      if (atual.length >= maximo) return atual;
      return [...atual, e];
    });
  }

  return (
    <div className="rounded-lg border border-stone-800 bg-stone-900/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">Reservatório</h3>
        {selecionadas.length > 0 && (
          <button
            type="button"
            className="text-xs text-stone-400 underline hover:text-stone-200"
            onClick={() => setSelecionadas([])}
          >
            limpar seleção
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {ORDEM_FICHAS.map((f) => {
          const info = INFO_FICHA[f];
          const quantidade = estado.reservatorio[f];

          // Ícor e Chronos são "fora do mercado" (Seção 3.1): nunca clicáveis
          // para colheita, sempre exibidos como blocos travados, separados
          // das essências por um divisor (Seção 19.3).
          if (f === 'icor' || f === 'chronos') {
            return (
              <div key={f} className="flex items-center gap-2">
                {f === 'icor' && (
                  <span className="h-10 w-px bg-stone-700" aria-hidden="true" title="fora do mercado" />
                )}
                <div
                  className={`flex flex-col items-center rounded-lg border px-3 py-2 ${info.corBorda} ${info.corFundo} ${info.corTexto} opacity-80`}
                  title={
                    f === 'icor'
                      ? 'Ícor não pode ser colhido diretamente — só via Reservar'
                      : 'Chronos não pode ser colhido — só ao reivindicar a 1ª Lenda de nível 3'
                  }
                >
                  <span className="text-lg">{info.icone}</span>
                  <span className="text-sm font-bold">{quantidade}</span>
                </div>
              </div>
            );
          }

          const essencia = f as Essencia;
          const selecionada = selecionadas.includes(essencia);
          const podeSelecionar =
            emEscolhendoAcao && quantidade > 0 && (selecionada || selecionadas.length < maximo);

          const iguais = podeColherIguais(estado, jogadorId, essencia);

          return (
            <div key={f} className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => alternar(essencia)}
                disabled={!podeSelecionar}
                title={
                  quantidade === 0
                    ? 'Pilha vazia'
                    : podeSelecionar
                      ? `Colher 1 ${info.rotulo} (Ação A)`
                      : 'Seleção de 3 diferentes já completa'
                }
                className={`flex flex-col items-center rounded-lg border-2 px-3 py-2 transition ${info.corFundo} ${info.corTexto} ${
                  selecionada
                    ? 'border-white ring-2 ring-white'
                    : podeSelecionar
                      ? `${info.corBorda} hover:brightness-110`
                      : 'border-transparent opacity-40'
                }`}
              >
                <span className="text-lg">{info.icone}</span>
                <span className="text-sm font-bold">{quantidade}</span>
              </button>
              <button
                type="button"
                disabled={!iguais.ok}
                title={iguais.ok ? `Colher 2 ${info.rotulo} (Ação B)` : iguais.motivo}
                onClick={() => despachar({ tipo: 'COLHER_IGUAIS', jogadorId, essencia })}
                className={`w-full rounded px-1 py-0.5 text-[10px] font-semibold ${
                  iguais.ok
                    ? 'bg-stone-700 text-stone-100 hover:bg-stone-600'
                    : 'cursor-not-allowed bg-stone-850 text-stone-600'
                }`}
              >
                2×
              </button>
            </div>
          );
        })}
      </div>

      {maximo > 0 && (
        <p className="mt-2 text-xs text-stone-500">
          Ação A: escolha {maximo} essência{maximo > 1 ? 's' : ''} diferentes ({selecionadas.length}/{maximo})
        </p>
      )}
    </div>
  );
}
