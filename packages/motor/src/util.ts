// Helpers internos, compartilhados por validar.ts e reduzir.ts.
// Nada aqui é aleatório ou depende de I/O — mantém o motor puro.

import { ESSENCIAS, FICHAS, type Bolsa, type Custo, type EstadoJogo, type Jogador } from './tipos.js';

export function bolsaVazia(): Bolsa {
  return { eter: 0, oceano: 0, terra: 0, chama: 0, sombra: 0, icor: 0, chronos: 0 };
}

export function custoVazio(): Custo {
  return { eter: 0, oceano: 0, terra: 0, chama: 0, sombra: 0 };
}

export function somaBolsa(b: Partial<Bolsa>): number {
  return FICHAS.reduce((acc, f) => acc + (b[f] ?? 0), 0);
}

export function somarBolsaEm(base: Bolsa, delta: Partial<Bolsa>): Bolsa {
  const resultado = { ...base };
  for (const f of FICHAS) resultado[f] = base[f] + (delta[f] ?? 0);
  return resultado;
}

export function subtrairBolsa(base: Bolsa, delta: Partial<Bolsa>): Bolsa {
  const resultado = { ...base };
  for (const f of FICHAS) resultado[f] = base[f] - (delta[f] ?? 0);
  return resultado;
}

// jogadorAtual/jogadorPorId/ehVezDe são genéricas em cima do formato de
// `jogadores` — chamadas com EstadoJogo (reduzir.ts, sempre) inferem Jogador
// normalmente; chamadas com EstadoVisivel (validar.ts, pra validar do lado
// do cliente — Seção 16.1) inferem JogadorVisivel. Zero mudança de
// comportamento pros call sites existentes.
export function jogadorAtual<E extends { jogadorAtual: number; jogadores: readonly { id: string }[] }>(
  e: E,
): E['jogadores'][number] {
  const j = e.jogadores[e.jogadorAtual];
  if (!j) throw new Error(`Índice de jogadorAtual inválido: ${e.jogadorAtual}`);
  return j;
}

export function jogadorPorId<E extends { jogadores: readonly { id: string }[] }>(
  e: E,
  id: string,
): E['jogadores'][number] | undefined {
  return e.jogadores.find((j) => j.id === id);
}

export function ehVezDe<E extends { jogadorAtual: number; jogadores: readonly { id: string }[] }>(
  e: E,
  jogadorId: string,
): boolean {
  return jogadorAtual(e).id === jogadorId;
}

export const NIVEIS = [1, 2, 3] as const;

export function cartaEstaVisivel(e: Pick<EstadoJogo, 'fileiras'>, cartaId: string): boolean {
  return NIVEIS.some((n) => e.fileiras[n].includes(cartaId));
}

export function atualizarJogador(e: EstadoJogo, id: string, fn: (j: Jogador) => Jogador): EstadoJogo {
  return { ...e, jogadores: e.jogadores.map((j) => (j.id === id ? fn(j) : j)) };
}

export { ESSENCIAS };
