// Seção 17.4 item 4 — oponentes em faixas de uma linha; tocar abre uma
// bottom-sheet com o tabuleiro completo daquele jogador. Só usa
// EstadoVisivel (projeção pública, Seção 16) — nunca o EstadoJogo real.

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { EstadoVisivel } from '@olympos/motor';
import { INFO_FICHA, ORDEM_FICHAS } from '../lib/tema.js';
import { DetalhesOponente } from './DetalhesOponente.js';

export function FaixaOponentesMobile({
  estadoVisivel,
  jogadorFocoId,
}: {
  estadoVisivel: EstadoVisivel;
  jogadorFocoId?: string;
}) {
  const idJogadorFoco = jogadorFocoId ?? estadoVisivel.jogadores[estadoVisivel.jogadorAtual]!.id;
  const oponentes = estadoVisivel.jogadores.filter((j) => j.id !== idJogadorFoco);
  const [aberto, setAberto] = useState<string | null>(null);
  const jogadorAberto = oponentes.find((j) => j.id === aberto) ?? null;

  return (
    <div className="flex flex-col border-b border-stone-800 bg-stone-900">
      {oponentes.map((j) => {
        const fichaDestaque = ORDEM_FICHAS.find((f) => j.fichas[f] > 0 && f !== 'icor');
        return (
          <button
            key={j.id}
            type="button"
            onClick={() => setAberto(j.id)}
            className="flex min-h-[48px] items-center gap-2 border-b border-stone-800/60 px-3 py-1.5 text-left last:border-b-0 active:bg-stone-800"
          >
            <span className="text-lg">{j.avatar}</span>
            <span className="truncate text-sm font-semibold text-stone-100">{j.nome}</span>
            <span className="text-sm font-bold text-amber-300">{j.kleos}★</span>
            <span className="text-xs text-stone-400" title={`${j.simbolosArgo} símbolo(s) do Argo`}>
              ⛵{j.simbolosArgo}
            </span>
            <span
              className={`text-xs ${j.temChronos ? 'text-stone-200' : 'text-stone-700'}`}
              title={j.temChronos ? 'Tem a Essência de Chronos' : 'Sem a Essência de Chronos'}
            >
              ⧗{j.temChronos ? '✓' : '✗'}
            </span>
            {estadoVisivel.argonautas.dono === j.id && (
              <motion.span
                layoutId="argonautas-coroa"
                className="text-xs text-amber-400"
                title="Está com Os Argonautas"
              >
                👑
              </motion.span>
            )}
            <span className="flex gap-0.5">
              {Array.from({ length: Math.min(3, j.lendas.length) }).map((_, i) => (
                <span key={i} className="text-stone-600">
                  ▪
                </span>
              ))}
            </span>
            {fichaDestaque && (
              <span className="ml-auto text-base" title={INFO_FICHA[fichaDestaque].rotulo}>
                {INFO_FICHA[fichaDestaque].icone}
              </span>
            )}
            {!j.conectado && <span className="text-xs text-stone-600">(offline)</span>}
            {j.turnosAusente >= 3 && (
              <span className="text-xs text-amber-500" title={`${j.turnosAusente} turnos sem agir`}>
                ⚠
              </span>
            )}
          </button>
        );
      })}

      {jogadorAberto && (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/60"
          onClick={() => setAberto(null)}
        >
          <div
            className="w-full rounded-t-2xl border-t border-stone-800 bg-stone-900 p-4 pb-6"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="mb-3 flex justify-center">
              <span className="h-1.5 w-10 rounded-full bg-stone-700" />
            </div>
            <DetalhesOponente jogador={jogadorAberto} donoArgonautasId={estadoVisivel.argonautas.dono} />
            <button
              type="button"
              onClick={() => setAberto(null)}
              className="mt-4 min-h-[48px] w-full rounded-lg bg-stone-800 text-sm font-semibold text-stone-300 active:bg-stone-700"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
