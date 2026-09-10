import { describe, expect, it } from 'vitest';
import { reduzir } from '../reduzir.js';
import type { Essencia } from '../tipos.js';
import { podeColherDiferentes, podeColherIguais } from '../validar.js';
import { esperarOk, novaPartida } from './ajuda.js';

describe('Colheita (Seção 7.1 / 7.2)', () => {
  it('Pegar 3 diferentes reduz o reservatório e aumenta a mão em exatamente 3', () => {
    const e = novaPartida('seed-colher-3', 4);
    const antes = { ...e.reservatorio };
    const jogadorId = e.jogadores[0]!.id;

    const r = reduzir(e, {
      tipo: 'COLHER_DIFERENTES',
      jogadorId,
      essencias: ['eter', 'oceano', 'terra'],
    });
    esperarOk(r);
    if (!r.ok) return;

    expect(r.valor.reservatorio.eter).toBe(antes.eter - 1);
    expect(r.valor.reservatorio.oceano).toBe(antes.oceano - 1);
    expect(r.valor.reservatorio.terra).toBe(antes.terra - 1);

    const jogador = r.valor.jogadores.find((j) => j.id === jogadorId)!;
    expect(jogador.fichas.eter + jogador.fichas.oceano + jogador.fichas.terra).toBe(3);
  });

  it('Pegar 2 iguais com pilha = 4 é legal', () => {
    const e = novaPartida('seed-2iguais-4', 4);
    const comPilha4 = { ...e, reservatorio: { ...e.reservatorio, eter: 4 } };
    const jogadorId = e.jogadores[0]!.id;

    const v = podeColherIguais(comPilha4, jogadorId, 'eter');
    expect(v.ok).toBe(true);
  });

  it('Pegar 2 iguais com pilha = 3 é ilegal', () => {
    const e = novaPartida('seed-2iguais-3', 4);
    const comPilha3 = { ...e, reservatorio: { ...e.reservatorio, eter: 3 } };
    const jogadorId = e.jogadores[0]!.id;

    const v = podeColherIguais(comPilha3, jogadorId, 'eter');
    expect(v.ok).toBe(false);
  });

  it('Com só 2 tipos disponíveis, a Ação A pega 2', () => {
    const e = novaPartida('seed-2tipos', 4);
    const soDoisTipos = {
      ...e,
      reservatorio: { ...e.reservatorio, eter: 3, oceano: 3, terra: 0, chama: 0, sombra: 0 },
    };
    const jogadorId = e.jogadores[0]!.id;

    expect(podeColherDiferentes(soDoisTipos, jogadorId, ['eter', 'oceano']).ok).toBe(true);
    expect(podeColherDiferentes(soDoisTipos, jogadorId, ['eter']).ok).toBe(false);
    expect(podeColherDiferentes(soDoisTipos, jogadorId, ['eter', 'oceano', 'terra']).ok).toBe(false);
  });

  it('Não é possível colher Ícor nem Chronos por A ou B', () => {
    const e = novaPartida('seed-sem-icor', 4);
    const jogadorId = e.jogadores[0]!.id;

    // A ação chega como JSON não tipado; simula 'icor'/'chronos' escapando do tipo Essencia.
    const icorComoEssencia = 'icor' as unknown as Essencia;
    const chronosComoEssencia = 'chronos' as unknown as Essencia;

    expect(podeColherIguais(e, jogadorId, icorComoEssencia).ok).toBe(false);
    expect(podeColherIguais(e, jogadorId, chronosComoEssencia).ok).toBe(false);
    expect(podeColherDiferentes(e, jogadorId, ['eter', 'oceano', icorComoEssencia]).ok).toBe(false);
    expect(podeColherDiferentes(e, jogadorId, ['eter', 'oceano', chronosComoEssencia]).ok).toBe(false);
  });
});
