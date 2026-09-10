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

describe('Santuários (Seção 10)', () => {
  it('Qualificação usa Domínios, nunca fichas', () => {
    const base = novaPartida('seed-santuario-dominios', 4);
    const jogadorId = base.jogadores[base.jogadorAtual]!.id;
    const semDominios = { ...base, santuariosDisponiveis: ['SAN-06A'] }; // Olimpo: 2 de cada essência

    // Fichas coloridas não valem nada aqui: sem Domínios, não qualifica.
    const r1 = reduzir(semDominios, {
      tipo: 'COLHER_DIFERENTES',
      jogadorId,
      essencias: ['eter', 'oceano', 'terra'],
    });
    esperarOk(r1);
    if (!r1.ok) return;
    expect(r1.valor.jogadores.find((j) => j.id === jogadorId)!.santuarios).toHaveLength(0);
    expect(r1.valor.santuariosDisponiveis).toContain('SAN-06A');

    // Com Domínios suficientes, qualifica e vale exatamente 3 Kléos.
    const comDominios = comJogador(semDominios, jogadorId, {
      dominios: { eter: 2, oceano: 2, terra: 2, chama: 2, sombra: 2 },
    });
    const r2 = reduzir(comDominios, {
      tipo: 'COLHER_DIFERENTES',
      jogadorId,
      essencias: ['eter', 'oceano', 'terra'],
    });
    esperarOk(r2);
    if (!r2.ok) return;
    const jogador = r2.valor.jogadores.find((j) => j.id === jogadorId)!;
    expect(jogador.santuarios).toContain('SAN-06A');
    expect(jogador.kleos).toBe(3);
    expect(r2.valor.santuariosDisponiveis).not.toContain('SAN-06A');
  });

  it('Com 2 santuários elegíveis no mesmo turno, entra em ESCOLHENDO_SANTUARIO', () => {
    const base = novaPartida('seed-santuario-2-elegiveis', 4);
    const jogadorId = base.jogadores[base.jogadorAtual]!.id;
    let e: EstadoJogo = { ...base, santuariosDisponiveis: ['SAN-06A', 'SAN-01A'] };
    e = comJogador(e, jogadorId, { dominios: { eter: 4, oceano: 4, terra: 4, chama: 4, sombra: 4 } });

    const r = reduzir(e, { tipo: 'COLHER_DIFERENTES', jogadorId, essencias: ['eter', 'oceano', 'terra'] });
    esperarOk(r);
    if (!r.ok) return;

    expect(r.valor.subFase).toBe('ESCOLHENDO_SANTUARIO');
    expect([...r.valor.escolhaSantuarioPendente!.opcoes].sort()).toEqual(['SAN-01A', 'SAN-06A']);
  });

  it('O santuário não escolhido continua disponível no turno seguinte', () => {
    const base = novaPartida('seed-santuario-nao-escolhido', 4);
    const jogadorId = base.jogadores[base.jogadorAtual]!.id;
    let e: EstadoJogo = { ...base, santuariosDisponiveis: ['SAN-06A', 'SAN-01A'] };
    e = comJogador(e, jogadorId, { dominios: { eter: 4, oceano: 4, terra: 4, chama: 4, sombra: 4 } });

    const r1 = reduzir(e, { tipo: 'COLHER_DIFERENTES', jogadorId, essencias: ['eter', 'oceano', 'terra'] });
    esperarOk(r1);
    if (!r1.ok) return;
    expect(r1.valor.subFase).toBe('ESCOLHENDO_SANTUARIO');

    const r2 = reduzir(r1.valor, { tipo: 'ESCOLHER_SANTUARIO', jogadorId, santuarioId: 'SAN-06A' });
    esperarOk(r2);
    if (!r2.ok) return;

    expect(r2.valor.subFase).toBe('ESCOLHENDO_ACAO');
    const jogador = r2.valor.jogadores.find((j) => j.id === jogadorId)!;
    expect(jogador.santuarios).toEqual(['SAN-06A']);
    expect(r2.valor.santuariosDisponiveis).toContain('SAN-01A');
    expect(r2.valor.santuariosDisponiveis).not.toContain('SAN-06A');
  });
});
