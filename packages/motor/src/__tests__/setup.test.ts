import { describe, expect, it } from 'vitest';
import { CONFIG_PARTIDA, ICOR_TOTAL } from '../dados/config.js';
import { SANTUARIOS } from '../dados/santuarios.js';
import { novaPartida } from './ajuda.js';

describe('Setup (Seção 4)', () => {
  it('2/3/4 jogadores geram 4/5/7 fichas por essência, 2/3/4 Chronos e sempre 5 Ícor', () => {
    for (const n of [2, 3, 4] as const) {
      const e = novaPartida(`seed-${n}`, n);
      const cfg = CONFIG_PARTIDA[n];
      for (const ess of ['eter', 'oceano', 'terra', 'chama', 'sombra'] as const) {
        expect(e.reservatorio[ess]).toBe(cfg.fichasPorEssencia);
      }
      expect(e.reservatorio.icor).toBe(ICOR_TOTAL);
      expect(e.reservatorio.chronos).toBe(cfg.chronos);
    }
  });

  it('2/3/4 jogadores revelam 2/3/4 Santuários (não N+1)', () => {
    const esperado = { 2: 2, 3: 3, 4: 4 } as const;
    for (const n of [2, 3, 4] as const) {
      const e = novaPartida(`seed-santuarios-${n}`, n);
      expect(e.santuariosDisponiveis.length).toBe(esperado[n]);
      expect(new Set(e.santuariosDisponiveis).size).toBe(esperado[n]);
    }
  });

  it('Nenhum cartão de Santuário entra em jogo com as duas faces', () => {
    for (const n of [2, 3, 4] as const) {
      const e = novaPartida(`seed-santuarios-cartao-${n}`, n);
      const cartoes = e.santuariosDisponiveis.map((id) => SANTUARIOS.find((s) => s.id === id)!.cartao);
      expect(new Set(cartoes).size).toBe(cartoes.length);
    }
  });

  it('Sempre 12 Lendas visíveis; baralhos com 36/26/16 cartas após o setup', () => {
    const e = novaPartida('seed-baralhos', 4);
    expect(e.fileiras[1].length).toBe(4);
    expect(e.fileiras[2].length).toBe(4);
    expect(e.fileiras[3].length).toBe(4);
    expect(e.fileiras[1].every((c) => c !== null)).toBe(true);
    expect(e.fileiras[2].every((c) => c !== null)).toBe(true);
    expect(e.fileiras[3].every((c) => c !== null)).toBe(true);

    expect(e.baralhos[1].length).toBe(36);
    expect(e.baralhos[2].length).toBe(26);
    expect(e.baralhos[3].length).toBe(16);
  });

  it('Mesmo seed ⇒ mesma partida, sempre (baralhos e Santuários)', () => {
    const e1 = novaPartida('seed-fixa', 3);
    const e2 = novaPartida('seed-fixa', 3);

    expect(e1.baralhos[1]).toEqual(e2.baralhos[1]);
    expect(e1.baralhos[2]).toEqual(e2.baralhos[2]);
    expect(e1.baralhos[3]).toEqual(e2.baralhos[3]);
    expect(e1.fileiras[1]).toEqual(e2.fileiras[1]);
    expect(e1.santuariosDisponiveis).toEqual(e2.santuariosDisponiveis);
    expect(e1.jogadores.map((j) => j.id)).toEqual(e2.jogadores.map((j) => j.id));
  });
});
