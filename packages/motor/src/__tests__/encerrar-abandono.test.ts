import { describe, expect, it } from 'vitest';
import { reduzir } from '../reduzir.js';
import { verificarInvariantes } from '../invariantes.js';
import { novaPartida } from './ajuda.js';

describe('ENCERRAR_ABANDONO (Seção 17.6 — votação de encerramento)', () => {
  it('encerra a partida sem vencedores, a partir de EM_ANDAMENTO', () => {
    const e = novaPartida('seed-abandono-1', 2);
    const resultado = reduzir(e, { tipo: 'ENCERRAR_ABANDONO', jogadorId: e.jogadores[0]!.id });

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor.fase).toBe('ENCERRADO');
    expect(resultado.valor.vencedores).toEqual([]);
    expect(resultado.valor.encerradaPorAbandono).toBe(true);
    expect(resultado.valor.prazoDoTurno).toBeNull();
  });

  it('é ilegal quando a partida já está ENCERRADO', () => {
    const e = novaPartida('seed-abandono-2', 2);
    const primeiro = reduzir(e, { tipo: 'ENCERRAR_ABANDONO', jogadorId: e.jogadores[0]!.id });
    expect(primeiro.ok).toBe(true);
    if (!primeiro.ok) return;

    const segundo = reduzir(primeiro.valor, { tipo: 'ENCERRAR_ABANDONO', jogadorId: e.jogadores[1]!.id });
    expect(segundo.ok).toBe(false);
  });

  it('não toca nos jogadores — invariantes continuam batendo', () => {
    const e = novaPartida('seed-abandono-3', 3);
    const resultado = reduzir(e, { tipo: 'ENCERRAR_ABANDONO', jogadorId: e.jogadores[1]!.id });
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;

    expect(resultado.valor.jogadores).toEqual(e.jogadores);
    expect(verificarInvariantes(resultado.valor)).toEqual([]);
  });

  it('registra o evento ENCERRADA_POR_ABANDONO no histórico', () => {
    const e = novaPartida('seed-abandono-4', 2);
    const jogadorId = e.jogadores[0]!.id;
    const resultado = reduzir(e, { tipo: 'ENCERRAR_ABANDONO', jogadorId });
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;

    const ultimo = resultado.valor.historico.at(-1);
    expect(ultimo).toEqual({ t: 'ENCERRADA_POR_ABANDONO', jogadorId });
  });
});
