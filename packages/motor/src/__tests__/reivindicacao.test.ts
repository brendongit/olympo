import { describe, expect, it } from 'vitest';
import { LENDA_POR_ID } from '../dados/lendas.js';
import { reduzir } from '../reduzir.js';
import type { EstadoJogo, Jogador } from '../tipos.js';
import { esperarOk, novaPartida } from './ajuda.js';

function comJogador(e: EstadoJogo, jogadorId: string, patch: Partial<Jogador>): EstadoJogo {
  return {
    ...e,
    jogadores: e.jogadores.map((j) => (j.id === jogadorId ? { ...j, ...patch } : j)),
  };
}

describe('Reivindicação (Seção 7.3)', () => {
  it('Domínios descontam corretamente; custo coberto ⇒ compra grátis', () => {
    const carta = LENDA_POR_ID['L1-ETE-08']!; // custo: terra 4
    const base = novaPartida('seed-gratis', 4);
    const jogadorId = base.jogadores[0]!.id;

    let e = comJogador(base, jogadorId, { dominios: { ...base.jogadores[0]!.dominios, terra: 4 } });
    e = { ...e, fileiras: { ...e.fileiras, 1: [carta.id, ...e.fileiras[1].slice(1)] } };

    const antesReservatorio = { ...e.reservatorio };
    const r = reduzir(e, { tipo: 'REIVINDICAR', jogadorId, cartaId: carta.id, origem: 'fileira' });
    esperarOk(r);
    if (!r.ok) return;

    expect(r.valor.reservatorio).toEqual(antesReservatorio); // nada foi pago
    const jogador = r.valor.jogadores.find((j) => j.id === jogadorId)!;
    expect(jogador.lendas).toContain(carta.id);
    expect(jogador.kleos).toBe(1);
  });

  it('Ícor cobre exatamente o faltante, nunca mais', () => {
    const carta = LENDA_POR_ID['L1-ETE-08']!; // custo: terra 4
    const base = novaPartida('seed-icor', 4);
    const jogadorId = base.jogadores[0]!.id;

    let e = comJogador(base, jogadorId, {
      fichas: { ...base.jogadores[0]!.fichas, terra: 1, icor: 10 },
    });
    e = {
      ...e,
      reservatorio: { ...e.reservatorio, icor: e.reservatorio.icor + 10 - 0 }, // reservatório cede o icor ao jogador de teste
      fileiras: { ...e.fileiras, 1: [carta.id, ...e.fileiras[1].slice(1)] },
    };

    const r = reduzir(e, { tipo: 'REIVINDICAR', jogadorId, cartaId: carta.id, origem: 'fileira' });
    esperarOk(r);
    if (!r.ok) return;

    const jogador = r.valor.jogadores.find((j) => j.id === jogadorId)!;
    // faltante = 4 (0 domínio), coberto com 1 ficha de terra + 3 de ícor.
    expect(jogador.fichas.terra).toBe(0);
    expect(jogador.fichas.icor).toBe(10 - 3);
  });

  it('Fichas pagas voltam ao reservatório na mesma ação', () => {
    const carta = LENDA_POR_ID['L1-ETE-01']!; // custo: oceano1 terra1 chama1 sombra1
    const base = novaPartida('seed-volta', 4);
    const jogadorId = base.jogadores[0]!.id;

    let e = comJogador(base, jogadorId, {
      fichas: { ...base.jogadores[0]!.fichas, oceano: 1, terra: 1, chama: 1, sombra: 1 },
    });
    e = { ...e, fileiras: { ...e.fileiras, 1: [carta.id, ...e.fileiras[1].slice(1)] } };
    const reservatorioAntes = { ...e.reservatorio };

    const r = reduzir(e, { tipo: 'REIVINDICAR', jogadorId, cartaId: carta.id, origem: 'fileira' });
    esperarOk(r);
    if (!r.ok) return;

    expect(r.valor.reservatorio.oceano).toBe(reservatorioAntes.oceano + 1);
    expect(r.valor.reservatorio.terra).toBe(reservatorioAntes.terra + 1);
    expect(r.valor.reservatorio.chama).toBe(reservatorioAntes.chama + 1);
    expect(r.valor.reservatorio.sombra).toBe(reservatorioAntes.sombra + 1);
  });

  it('Reposição imediata da fileira; baralho vazio ⇒ null permanente', () => {
    const carta = LENDA_POR_ID['L1-ETE-08']!;
    const base = novaPartida('seed-reposicao', 4);
    const jogadorId = base.jogadores[0]!.id;
    let e = comJogador(base, jogadorId, { dominios: { ...base.jogadores[0]!.dominios, terra: 4 } });
    e = { ...e, fileiras: { ...e.fileiras, 1: [carta.id, ...e.fileiras[1].slice(1)] } };

    // Caso 1: baralho tem cartas -> reposição imediata.
    const r1 = reduzir(e, { tipo: 'REIVINDICAR', jogadorId, cartaId: carta.id, origem: 'fileira' });
    esperarOk(r1);
    if (!r1.ok) return;
    expect(r1.valor.fileiras[1][0]).not.toBeNull();
    expect(r1.valor.baralhos[1].length).toBe(e.baralhos[1].length - 1);

    // Caso 2: baralho vazio -> espaço fica null.
    const eSemBaralho = { ...e, baralhos: { ...e.baralhos, 1: [] } };
    const r2 = reduzir(eSemBaralho, { tipo: 'REIVINDICAR', jogadorId, cartaId: carta.id, origem: 'fileira' });
    esperarOk(r2);
    if (!r2.ok) return;
    expect(r2.valor.fileiras[1][0]).toBeNull();
  });

  it('Reivindicar Presságio não repõe nada', () => {
    const carta = LENDA_POR_ID['L1-ETE-08']!;
    const base = novaPartida('seed-pressagio-sem-reposicao', 4);
    const jogadorId = base.jogadores[0]!.id;

    const e = comJogador(base, jogadorId, {
      dominios: { ...base.jogadores[0]!.dominios, terra: 4 },
      pressagios: [{ cartaId: carta.id, oculto: false, nivel: 1 }],
    });
    const baralho1Antes = [...e.baralhos[1]];
    const fileira1Antes = [...e.fileiras[1]];

    const r = reduzir(e, { tipo: 'REIVINDICAR', jogadorId, cartaId: carta.id, origem: 'pressagio' });
    esperarOk(r);
    if (!r.ok) return;

    expect(r.valor.baralhos[1]).toEqual(baralho1Antes);
    expect(r.valor.fileiras[1]).toEqual(fileira1Antes);
    const jogador = r.valor.jogadores.find((j) => j.id === jogadorId)!;
    expect(jogador.pressagios).toHaveLength(0);
    expect(jogador.lendas).toContain(carta.id);
  });

  it('Reivindicar Presságio de nível 3 com baralho 3 vazio é legal', () => {
    const carta = LENDA_POR_ID['L3-ETE-02']!; // custo: chama 7
    const base = novaPartida('seed-pressagio-n3', 4);
    const jogadorId = base.jogadores[0]!.id;

    let e = comJogador(base, jogadorId, {
      dominios: { ...base.jogadores[0]!.dominios, chama: 7 },
      pressagios: [{ cartaId: carta.id, oculto: true, nivel: 3 }],
    });
    e = { ...e, baralhos: { ...e.baralhos, 3: [] } };

    const r = reduzir(e, {
      tipo: 'REIVINDICAR',
      jogadorId,
      cartaId: carta.id,
      origem: 'pressagio',
    });
    esperarOk(r);
  });

  it('Chronos nunca aparece no pagamento, mesmo com o jogador a possuindo', () => {
    const carta = LENDA_POR_ID['L1-ETE-01']!; // custo: oceano1 terra1 chama1 sombra1
    const base = novaPartida('seed-chronos-nunca-paga', 4);
    const jogadorId = base.jogadores[0]!.id;

    let e = comJogador(base, jogadorId, {
      fichas: { ...base.jogadores[0]!.fichas, oceano: 1, terra: 1, chama: 1, sombra: 1, chronos: 1 },
      temChronos: true,
    });
    e = { ...e, fileiras: { ...e.fileiras, 1: [carta.id, ...e.fileiras[1].slice(1)] } };

    const r = reduzir(e, { tipo: 'REIVINDICAR', jogadorId, cartaId: carta.id, origem: 'fileira' });
    esperarOk(r);
    if (!r.ok) return;

    const jogador = r.valor.jogadores.find((j) => j.id === jogadorId)!;
    expect(jogador.fichas.chronos).toBe(1); // intocado
    expect(r.valor.reservatorio.chronos).toBe(e.reservatorio.chronos); // nada voltou ao reservatório
  });

  it('Rejeita origem que não bate com onde a carta realmente está', () => {
    const cartaFileira = LENDA_POR_ID['L1-ETE-08']!;
    const cartaPressagio = LENDA_POR_ID['L1-ETE-01']!;
    const base = novaPartida('seed-origem-mentirosa', 4);
    const jogadorId = base.jogadores[0]!.id;

    let e = comJogador(base, jogadorId, {
      dominios: { ...base.jogadores[0]!.dominios, terra: 4, oceano: 4, chama: 4, sombra: 4 },
      pressagios: [{ cartaId: cartaPressagio.id, oculto: false, nivel: 1 }],
    });
    e = { ...e, fileiras: { ...e.fileiras, 1: [cartaFileira.id, ...e.fileiras[1].slice(1)] } };

    // Carta está na fileira, mas o cliente alega que é um presságio.
    const r1 = reduzir(e, {
      tipo: 'REIVINDICAR',
      jogadorId,
      cartaId: cartaFileira.id,
      origem: 'pressagio',
    });
    expect(r1.ok).toBe(false);

    // Carta é um presságio, mas o cliente alega que está na fileira.
    const r2 = reduzir(e, {
      tipo: 'REIVINDICAR',
      jogadorId,
      cartaId: cartaPressagio.id,
      origem: 'fileira',
    });
    expect(r2.ok).toBe(false);

    // O estado não deve ter sido corrompido: fileira segue com 4 posições reais.
    expect(e.fileiras[1]).toHaveLength(4);
  });
});
