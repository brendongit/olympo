// Ações A e B (Seção 7.1/7.2). Toda decisão de legalidade vem de
// podeColherDiferentes/podeColherIguais — este componente só junta cliques
// numa seleção e despacha quando ela fica completa.

import { useEffect, useState } from 'react';
import type { Essencia, EstadoVisivel, Ficha } from '@olympos/motor';
import { podeColherIguais } from '@olympos/motor';
import { estiloAltoContraste, INFO_FICHA, ORDEM_FICHAS } from '../lib/tema.js';
import { useEventosDoJogo } from '../lib/useEventosDoJogo.js';
import { useNavegacaoPorSetas } from '../lib/useNavegacaoPorSetas.js';
import { usePartida } from '../loja/usePartida.js';
import { usePreferencias } from '../loja/usePreferencias.js';

const DURACAO_PULSO_MS = 300;

export function Reservatorio({
  estadoVisivel,
  jogadorFocoId,
}: {
  estadoVisivel: EstadoVisivel;
  jogadorFocoId?: string;
}) {
  const despachar = usePartida((s) => s.despachar);
  const altoContraste = usePreferencias((s) => s.altoContraste);
  const { containerRef, aoTeclar } = useNavegacaoPorSetas<HTMLDivElement>();
  const [selecionadas, setSelecionadas] = useState<Essencia[]>([]);
  const [pulsando, setPulsando] = useState<Set<Ficha>>(new Set());
  const jogadorId = jogadorFocoId ?? estadoVisivel.jogadores[estadoVisivel.jogadorAtual]!.id;

  // Seção 19.8 — "ficha colhida voa do reservatório ao painel": em vez de um
  // token voando de verdade (exigiria medir posição de DOM entre
  // componentes não relacionados), um pulso sincronizado no reservatório dá
  // o mesmo feedback causal com uma fração do esforço.
  useEventosDoJogo((evento) => {
    if (evento.t !== 'COLHEU' && evento.t !== 'DEVOLVEU') return;
    const chaves = Object.keys(evento.fichas) as Ficha[];
    setPulsando((atual) => new Set([...atual, ...chaves]));
    setTimeout(() => {
      setPulsando((atual) => {
        const novo = new Set(atual);
        for (const c of chaves) novo.delete(c);
        return novo;
      });
    }, DURACAO_PULSO_MS);
  });

  const disponiveis = (['eter', 'oceano', 'terra', 'chama', 'sombra'] as const).filter(
    (e) => estadoVisivel.reservatorio[e] > 0,
  );
  const maximo = Math.min(3, disponiveis.length);

  useEffect(() => {
    if (maximo > 0 && selecionadas.length === maximo) {
      despachar({ tipo: 'COLHER_DIFERENTES', jogadorId, essencias: selecionadas });
      setSelecionadas([]);
    }
  }, [selecionadas, maximo, jogadorId, despachar]);

  const emEscolhendoAcao = estadoVisivel.subFase === 'ESCOLHENDO_ACAO';

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

      <div
        ref={containerRef}
        onKeyDown={aoTeclar}
        role="group"
        aria-label="Fichas do reservatório"
        className="flex flex-col gap-1.5"
      >
        {ORDEM_FICHAS.map((f) => {
          const info = INFO_FICHA[f];
          const quantidade = estadoVisivel.reservatorio[f];

          // Ícor e Chronos são "fora do mercado" (Seção 3.1): nunca clicáveis
          // para colheita, sempre exibidos como blocos travados, separados
          // das essências por um divisor (Seção 19.3).
          if (f === 'icor' || f === 'chronos') {
            return (
              <div key={f} className="contents">
                {f === 'icor' && (
                  <span className="my-0.5 h-px w-full bg-stone-700" aria-hidden="true" title="fora do mercado" />
                )}
                <div
                  className={`flex items-center justify-between rounded-lg border px-2 py-1 ${info.corBorda} ${info.corFundo} ${info.corTexto} opacity-80`}
                  style={estiloAltoContraste(f, altoContraste)}
                  title={
                    f === 'icor'
                      ? 'Ícor não pode ser colhido diretamente — só via Reservar'
                      : 'Chronos não pode ser colhido — só ao reivindicar a 1ª Lenda de nível 3'
                  }
                >
                  <span className="flex items-center gap-1 text-sm">
                    <span>{info.icone}</span>
                    {info.rotulo}
                  </span>
                  <span
                    className={`text-sm font-bold transition-transform duration-300 motion-reduce:transition-none ${pulsando.has(f) ? 'scale-125 text-amber-300' : ''}`}
                  >
                    {quantidade}
                  </span>
                </div>
              </div>
            );
          }

          const essencia = f as Essencia;
          const selecionada = selecionadas.includes(essencia);
          const podeSelecionar =
            emEscolhendoAcao && quantidade > 0 && (selecionada || selecionadas.length < maximo);

          const iguais = podeColherIguais(estadoVisivel, jogadorId, essencia);

          return (
            <div key={f} className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => alternar(essencia)}
                disabled={!podeSelecionar}
                style={estiloAltoContraste(f, altoContraste)}
                title={
                  quantidade === 0
                    ? 'Pilha vazia'
                    : podeSelecionar
                      ? `Colher 1 ${info.rotulo} (Ação A)`
                      : 'Seleção de 3 diferentes já completa'
                }
                className={`flex flex-1 items-center justify-between rounded-lg border-2 px-2 py-1 transition ${info.corFundo} ${info.corTexto} ${
                  selecionada
                    ? 'border-white ring-2 ring-white'
                    : podeSelecionar
                      ? `${info.corBorda} hover:brightness-110`
                      : 'border-transparent opacity-40'
                }`}
              >
                <span className="flex items-center gap-1 text-sm">
                  <span>{info.icone}</span>
                  {info.rotulo}
                </span>
                <span
                  className={`text-sm font-bold transition-transform duration-300 motion-reduce:transition-none ${pulsando.has(f) ? 'scale-125 text-amber-300' : ''}`}
                >
                  {quantidade}
                </span>
              </button>
              <button
                type="button"
                disabled={!iguais.ok}
                title={iguais.ok ? `Colher 2 ${info.rotulo} (Ação B)` : iguais.motivo}
                onClick={() => despachar({ tipo: 'COLHER_IGUAIS', jogadorId, essencia })}
                className={`shrink-0 rounded px-1.5 py-1 text-[10px] font-semibold ${
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
