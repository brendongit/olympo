import { describe, expect, it } from 'vitest';
import { LENDAS, LENDA_POR_ID } from '../dados/lendas.js';
import { reduzir } from '../reduzir.js';
import type { EstadoJogo, Jogador } from '../tipos.js';
import { esperarOk, novaPartida } from './ajuda.js';

function comJogador(e: EstadoJogo, jogadorId: string, patch: Partial<Jogador>): EstadoJogo {
  return {
    ...e,
    jogadores: e.jogadores.map((j) => (j.id === jogadorId ? { ...j, ...patch } : j)),
  };
}

describe('Essência de Chronos (Seção 9)', () => {
  it('Reivindicar a 1ª Lenda de nível 3 concede exatamente 1 Chronos', () => {
    const carta = LENDA_POR_ID['L3-ETE-02']!; // custo: chama 7
    const base = novaPartida('seed-chronos-1a', 4);
    const jogadorId = base.jogadores[0]!.id;
    let e = comJogador(base, jogadorId, { dominios: { ...base.jogadores[0]!.dominios, chama: 7 } });
    e = { ...e, fileiras: { ...e.fileiras, 3: [carta.id, ...e.fileiras[3].slice(1)] } };

    const chronosAntes = e.reservatorio.chronos;
    const r = reduzir(e, { tipo: 'REIVINDICAR', jogadorId, cartaId: carta.id, origem: 'fileira' });
    esperarOk(r);
    if (!r.ok) return;

    const jogador = r.valor.jogadores.find((j) => j.id === jogadorId)!;
    expect(jogador.fichas.chronos).toBe(1);
    expect(jogador.temChronos).toBe(true);
    expect(r.valor.reservatorio.chronos).toBe(chronosAntes - 1);
    expect(r.valor.historico.some((ev) => ev.t === 'GANHOU_CHRONOS' && ev.jogadorId === jogadorId)).toBe(true);
  });

  it('Reivindicar a 2ª, 3ª e 4ª Lenda de nível 3 não concede nada', () => {
    const carta2 = LENDA_POR_ID['L3-TER-02']!; // custo: eter 7
    const base = novaPartida('seed-chronos-2a', 4);
    const jogadorId = base.jogadores[0]!.id;
    let e = comJogador(base, jogadorId, {
      dominios: { ...base.jogadores[0]!.dominios, eter: 7 },
      temChronos: true,
      fichas: { ...base.jogadores[0]!.fichas, chronos: 1 },
    });
    e = { ...e, fileiras: { ...e.fileiras, 3: [carta2.id, ...e.fileiras[3].slice(1)] } };

    const chronosAntes = e.reservatorio.chronos;
    const r = reduzir(e, { tipo: 'REIVINDICAR', jogadorId, cartaId: carta2.id, origem: 'fileira' });
    esperarOk(r);
    if (!r.ok) return;

    const jogador = r.valor.jogadores.find((j) => j.id === jogadorId)!;
    expect(jogador.fichas.chronos).toBe(1); // continua 1, nunca 2
    expect(r.valor.reservatorio.chronos).toBe(chronosAntes); // nada saiu do reservatório
  });

  it('Reivindicar um Presságio de nível 3 concede Chronos igualmente', () => {
    const carta = LENDA_POR_ID['L3-ETE-02']!;
    const base = novaPartida('seed-chronos-pressagio', 4);
    const jogadorId = base.jogadores[0]!.id;
    const e = comJogador(base, jogadorId, {
      dominios: { ...base.jogadores[0]!.dominios, chama: 7 },
      pressagios: [{ cartaId: carta.id, oculto: true, nivel: 3 }],
    });

    const r = reduzir(e, { tipo: 'REIVINDICAR', jogadorId, cartaId: carta.id, origem: 'pressagio' });
    esperarOk(r);
    if (!r.ok) return;

    const jogador = r.valor.jogadores.find((j) => j.id === jogadorId)!;
    expect(jogador.temChronos).toBe(true);
  });

  it('Nenhuma carta de nível 1 ou 2 concede Chronos', () => {
    expect(LENDAS.filter((l) => l.nivel !== 3).every((l) => l.chronos === false)).toBe(true);

    const carta = LENDA_POR_ID['L1-ETE-08']!; // custo: terra 4
    const base = novaPartida('seed-chronos-nivel1', 4);
    const jogadorId = base.jogadores[0]!.id;
    let e = comJogador(base, jogadorId, { dominios: { ...base.jogadores[0]!.dominios, terra: 4 } });
    e = { ...e, fileiras: { ...e.fileiras, 1: [carta.id, ...e.fileiras[1].slice(1)] } };

    const r = reduzir(e, { tipo: 'REIVINDICAR', jogadorId, cartaId: carta.id, origem: 'fileira' });
    esperarOk(r);
    if (!r.ok) return;

    const jogador = r.valor.jogadores.find((j) => j.id === jogadorId)!;
    expect(jogador.temChronos).toBe(false);
  });

  it('Chronos conta para o limite de 10', () => {
    const base = novaPartida('seed-chronos-limite', 4);
    const jogadorId = base.jogadores[0]!.id;
    const estado = comJogador(base, jogadorId, {
      fichas: { eter: 2, oceano: 2, terra: 2, chama: 2, sombra: 1, icor: 0, chronos: 1 },
      temChronos: true,
    });

    const r = reduzir(estado, {
      tipo: 'COLHER_DIFERENTES',
      jogadorId,
      essencias: ['eter', 'oceano', 'terra'],
    });
    esperarOk(r);
    if (!r.ok) return;

    expect(r.valor.subFase).toBe('DESCARTANDO');
    expect(r.valor.descartePendente).toEqual({ jogadorId, excedente: 3 }); // 10 + 3 - 10
  });

  it('Devolver Chronos é rejeitado, inclusive quando é a única ficha "sobrando"', () => {
    const base = novaPartida('seed-chronos-devolver', 4);
    const jogadorId = base.jogadores[0]!.id;
    const estado: EstadoJogo = {
      ...comJogador(base, jogadorId, {
        fichas: { eter: 1, oceano: 1, terra: 1, chama: 0, sombra: 0, icor: 0, chronos: 1 },
        temChronos: true,
      }),
      subFase: 'DESCARTANDO',
      descartePendente: { jogadorId, excedente: 1 },
    };

    const r = reduzir(estado, { tipo: 'DEVOLVER_FICHAS', jogadorId, fichas: { chronos: 1 } });
    expect(r.ok).toBe(false);

    // A devolução correta usa uma das essências, nunca Chronos.
    const r2 = reduzir(estado, { tipo: 'DEVOLVER_FICHAS', jogadorId, fichas: { eter: 1 } });
    expect(r2.ok).toBe(true);
  });
});
