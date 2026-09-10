// Seção 19.5 — o painel do Keraunos. "É o elemento de UI mais importante do
// jogo e o que mais difere de um Splendor comum. Nunca pode sair da tela."
//
// Os três requisitos (Seção 5) são só leitura de campos já públicos
// (kleos, dominios, temChronos) — nenhuma regra é decidida aqui.

import type { Essencia, EstadoJogo, Jogador } from '@olympos/motor';
import { KLEOS_KERAUNOS } from '@olympos/motor';
import { INFO_FICHA, ORDEM_ESSENCIAS } from '../lib/tema.js';

interface Progresso {
  kleosOk: boolean;
  dominiosFaltando: Essencia[];
  chronosOk: boolean;
  tudoOk: boolean;
}

function calcularProgresso(jogador: Pick<Jogador, 'kleos' | 'dominios' | 'temChronos'>): Progresso {
  const kleosOk = jogador.kleos >= KLEOS_KERAUNOS;
  const dominiosFaltando = ORDEM_ESSENCIAS.filter((e) => jogador.dominios[e] < 1);
  const chronosOk = jogador.temChronos;
  return { kleosOk, dominiosFaltando, chronosOk, tudoOk: kleosOk && dominiosFaltando.length === 0 && chronosOk };
}

/** Símbolo ✓/◐/✗ com rótulo textual para leitor de tela (Seção 20). */
function Estado({ ok, parcial }: { ok: boolean; parcial?: boolean }) {
  const simbolo = ok ? '✓' : parcial ? '◐' : '✗';
  const cor = ok ? 'text-green-400' : parcial ? 'text-amber-400' : 'text-stone-500';
  const rotulo = ok ? 'cumprido' : parcial ? 'parcialmente cumprido' : 'não cumprido';
  return (
    <span className={`font-bold ${cor}`}>
      <span aria-hidden="true">{simbolo}</span>
      <span className="sr-only"> {rotulo}</span>
    </span>
  );
}

/** Versão de uma linha para a barra fixa do mobile (Seção 19.4). */
export function BarraKeraunosCompacta({ estado }: { estado: EstadoJogo }) {
  const jogador = estado.jogadores[estado.jogadorAtual]!;
  const p = calcularProgresso(jogador);
  const dominiosOk = p.dominiosFaltando.length === 0;

  return (
    <div
      className={`flex shrink-0 items-center gap-3 px-3 py-1 text-xs font-semibold ${
        p.tudoOk ? 'bg-amber-400/20 text-amber-200' : 'bg-stone-900 text-stone-300'
      }`}
    >
      <span className="flex items-center gap-1" title={`Kléos: ${jogador.kleos}/${KLEOS_KERAUNOS}`}>
        ⚡{jogador.kleos}
        <Estado ok={p.kleosOk} />
      </span>
      <span className="flex items-center gap-1" title="Domínios — 1 de cada essência">
        🜲{5 - p.dominiosFaltando.length}/5
        <Estado ok={dominiosOk} parcial={!dominiosOk && p.dominiosFaltando.length < 5} />
      </span>
      <span className="flex items-center gap-1" title="Essência de Chronos">
        ⧗<Estado ok={p.chronosOk} />
      </span>
      <span className="ml-auto uppercase tracking-wide text-stone-500">Keraunos</span>
    </div>
  );
}

export function PainelKeraunos({ estado }: { estado: EstadoJogo }) {
  const jogador = estado.jogadores[estado.jogadorAtual]!;
  const progresso = calcularProgresso(jogador);
  const dominiosOk = progresso.dominiosFaltando.length === 0;
  const outros = estado.jogadores.filter((j) => j.id !== jogador.id);

  return (
    <div
      className={`rounded-xl border p-3 ${
        progresso.tudoOk ? 'border-amber-400 bg-amber-400/10' : 'border-stone-800 bg-stone-900/60'
      }`}
    >
      <h2 className="mb-2 flex items-center gap-1 text-sm font-bold uppercase tracking-wide text-amber-200">
        <span aria-hidden="true">⚡</span> Keraunos
      </h2>

      <ul className="flex flex-col gap-1.5 text-sm">
        <li className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Estado ok={progresso.kleosOk} />
            {KLEOS_KERAUNOS} Kléos
          </span>
          <span className="text-stone-400">
            {jogador.kleos}/{KLEOS_KERAUNOS}
          </span>
        </li>

        <li className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Estado ok={dominiosOk} parcial={!dominiosOk && progresso.dominiosFaltando.length < 5} />
            1 Domínio de cada
          </span>
          <span className="flex gap-1">
            {ORDEM_ESSENCIAS.map((e) => (
              <span key={e} title={INFO_FICHA[e].rotulo}>
                {INFO_FICHA[e].icone}
                <span aria-hidden="true">{progresso.dominiosFaltando.includes(e) ? '✗' : '✓'}</span>
                <span className="sr-only">
                  {INFO_FICHA[e].rotulo} {progresso.dominiosFaltando.includes(e) ? 'faltando' : 'obtido'}
                </span>
              </span>
            ))}
          </span>
        </li>

        <li className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Estado ok={progresso.chronosOk} />
            Essência de Chronos
          </span>
          <span className="text-right text-xs text-stone-400">
            {progresso.chronosOk ? 'conquistada' : 'reivindique qualquer Lenda de nível 3'}
          </span>
        </li>
      </ul>

      {progresso.tudoOk && (
        <p className="mt-2 rounded bg-amber-400/20 px-2 py-1 text-center text-xs font-semibold text-amber-200">
          Você pode forjar o Keraunos ao final deste turno.
        </p>
      )}

      {outros.length > 0 && (
        <div className="mt-3 border-t border-stone-800 pt-2">
          <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
            Progresso dos oponentes
          </h3>
          <ul className="flex flex-col gap-1">
            {outros.map((j) => {
              const p = calcularProgresso(j);
              const jDominiosOk = p.dominiosFaltando.length === 0;
              return (
                <li key={j.id} className="flex items-center gap-1.5 text-xs text-stone-400">
                  <span className="flex-1 truncate">
                    {j.avatar} {j.nome}
                  </span>
                  <Estado ok={p.kleosOk} />
                  <span title="Domínios">{5 - p.dominiosFaltando.length}/5</span>
                  <Estado ok={jDominiosOk} parcial={!jDominiosOk && p.dominiosFaltando.length < 5} />
                  <span title="Essência de Chronos">⧗</span>
                  <Estado ok={p.chronosOk} />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
