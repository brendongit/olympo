import { describe, expect, it } from 'vitest';
import { reduzir } from '../reduzir.js';
import type { EstadoJogo, Jogador } from '../tipos.js';
import { esperarOk, novaPartida } from './ajuda.js';

function comJogador(e: EstadoJogo, jogadorId: string, patch: Partial<Jogador>): EstadoJogo {
  return {
    ...e,
    jogadores: e.jogadores.map((j) => (j.id === jogadorId ? { ...j, ...patch } : j)),
  };
}

function estadoCom10Fichas(seed: string): { estado: EstadoJogo; jogadorId: string } {
  const base = novaPartida(seed, 4);
  const jogadorId = base.jogadores[0]!.id;
  const estado = comJogador(base, jogadorId, {
    fichas: { eter: 2, oceano: 2, terra: 2, chama: 2, sombra: 2, icor: 0, chronos: 0 },
  });
  return { estado, jogadorId };
}

describe('Limite de 10 essências (Seção 8)', () => {
  it('10 fichas + colher 3 ⇒ DESCARTANDO com excedente 3', () => {
    const { estado, jogadorId } = estadoCom10Fichas('seed-limite');
    const semColoridasNoReservatorio = estado.reservatorio;
    // garante 3 tipos disponíveis para colher
    const comReservatorio = { ...estado, reservatorio: { ...semColoridasNoReservatorio } };

    const r = reduzir(comReservatorio, {
      tipo: 'COLHER_DIFERENTES',
      jogadorId,
      essencias: ['eter', 'oceano', 'terra'],
    });
    esperarOk(r);
    if (!r.ok) return;

    expect(r.valor.subFase).toBe('DESCARTANDO');
    expect(r.valor.descartePendente).toEqual({ jogadorId, excedente: 3 });
  });

  it('Devolver número diferente do excedente é rejeitado', () => {
    const { estado, jogadorId } = estadoCom10Fichas('seed-devolver-errado');
    const r1 = reduzir(estado, {
      tipo: 'COLHER_DIFERENTES',
      jogadorId,
      essencias: ['eter', 'oceano', 'terra'],
    });
    esperarOk(r1);
    if (!r1.ok) return;

    const r2 = reduzir(r1.valor, { tipo: 'DEVOLVER_FICHAS', jogadorId, fichas: { eter: 1 } }); // devolve 1, precisa 3
    expect(r2.ok).toBe(false);
  });

  it('Devolver fichas que o jogador não tem é rejeitado', () => {
    const { estado, jogadorId } = estadoCom10Fichas('seed-devolver-sem-ter');
    const r1 = reduzir(estado, {
      tipo: 'COLHER_DIFERENTES',
      jogadorId,
      essencias: ['eter', 'oceano', 'terra'],
    });
    esperarOk(r1);
    if (!r1.ok) return;

    // Jogador não tem sombra suficiente para devolver 3 unidades dela.
    const r2 = reduzir(r1.valor, { tipo: 'DEVOLVER_FICHAS', jogadorId, fichas: { sombra: 3 } });
    expect(r2.ok).toBe(false);
  });

  it('O turno não avança enquanto DESCARTANDO', () => {
    const { estado, jogadorId } = estadoCom10Fichas('seed-nao-avanca');
    const r1 = reduzir(estado, {
      tipo: 'COLHER_DIFERENTES',
      jogadorId,
      essencias: ['eter', 'oceano', 'terra'],
    });
    esperarOk(r1);
    if (!r1.ok) return;
    expect(r1.valor.jogadorAtual).toBe(estado.jogadorAtual);
    expect(r1.valor.subFase).toBe('DESCARTANDO');

    const r2 = reduzir(r1.valor, {
      tipo: 'DEVOLVER_FICHAS',
      jogadorId,
      fichas: { eter: 1, oceano: 1, terra: 1 },
    });
    esperarOk(r2);
    if (!r2.ok) return;
    expect(r2.valor.subFase).toBe('ESCOLHENDO_ACAO');
    expect(r2.valor.jogadorAtual).toBe((estado.jogadorAtual + 1) % estado.jogadores.length);
  });
});
