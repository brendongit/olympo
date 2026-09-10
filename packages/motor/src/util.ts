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

export function jogadorAtual(e: EstadoJogo): Jogador {
  const j = e.jogadores[e.jogadorAtual];
  if (!j) throw new Error(`Índice de jogadorAtual inválido: ${e.jogadorAtual}`);
  return j;
}

export function jogadorPorId(e: EstadoJogo, id: string): Jogador | undefined {
  return e.jogadores.find((j) => j.id === id);
}

export function ehVezDe(e: EstadoJogo, jogadorId: string): boolean {
  return jogadorAtual(e).id === jogadorId;
}

export const NIVEIS = [1, 2, 3] as const;

export function cartaEstaVisivel(e: EstadoJogo, cartaId: string): boolean {
  return NIVEIS.some((n) => e.fileiras[n].includes(cartaId));
}

export function atualizarJogador(e: EstadoJogo, id: string, fn: (j: Jogador) => Jogador): EstadoJogo {
  return { ...e, jogadores: e.jogadores.map((j) => (j.id === id ? fn(j) : j)) };
}

export { ESSENCIAS };
