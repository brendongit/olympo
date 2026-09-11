import { describe, expect, it } from 'vitest';
import { criarPartida } from '@olympos/motor';
import { colheitaAutomatica, devolucaoAutomatica, santuarioAutomatico } from './acaoAutomatica.js';

function partida() {
  return criarPartida({
    partidaId: 'p1',
    seed: 'seed-fixa',
    jogadores: [
      { id: 'j1', nome: 'Helena', avatar: '🦉' },
      { id: 'j2', nome: 'Rafael', avatar: '🔱' },
    ],
  });
}

describe('colheitaAutomatica (Seção 17.6)', () => {
  it('colhe até 3 essências diferentes disponíveis no reservatório', () => {
    const estado = partida();
    const acao = colheitaAutomatica(estado);
    expect(acao.tipo).toBe('COLHER_DIFERENTES');
    if (acao.tipo !== 'COLHER_DIFERENTES') return;
    expect(acao.essencias.length).toBe(3);
  });

  it('colhe o máximo disponível quando há menos de 3 tipos', () => {
    const estado = partida();
    const reservatorio = { ...estado.reservatorio, eter: 0, oceano: 0, terra: 0 };
    const acao = colheitaAutomatica({ ...estado, reservatorio });
    expect(acao.tipo).toBe('COLHER_DIFERENTES');
    if (acao.tipo !== 'COLHER_DIFERENTES') return;
    expect(acao.essencias.sort()).toEqual(['chama', 'sombra']);
  });

  it('passa quando o reservatório não tem nenhuma essência colorida', () => {
    const estado = partida();
    const reservatorio = { ...estado.reservatorio, eter: 0, oceano: 0, terra: 0, chama: 0, sombra: 0 };
    const acao = colheitaAutomatica({ ...estado, reservatorio });
    expect(acao).toEqual({ tipo: 'PASSAR', jogadorId: estado.jogadores[estado.jogadorAtual]!.id });
  });
});

describe('devolucaoAutomatica (Seção 17.6)', () => {
  it('nunca inclui Chronos, mesmo se for a única ficha em excesso', () => {
    const jogador = { fichas: { eter: 0, oceano: 0, terra: 0, chama: 0, sombra: 0, icor: 0, chronos: 1 } };
    const devolvido = devolucaoAutomatica(jogador, 1);
    expect(devolvido.chronos).toBeUndefined();
  });

  it('devolve a ficha mais abundante primeiro', () => {
    const jogador = { fichas: { eter: 5, oceano: 1, terra: 0, chama: 0, sombra: 0, icor: 0, chronos: 0 } };
    const devolvido = devolucaoAutomatica(jogador, 2);
    expect(devolvido).toEqual({ eter: 2 });
  });

  it('evita Ícor enquanto houver outra ficha disponível', () => {
    const jogador = { fichas: { eter: 1, oceano: 0, terra: 0, chama: 0, sombra: 0, icor: 5, chronos: 0 } };
    const devolvido = devolucaoAutomatica(jogador, 1);
    expect(devolvido).toEqual({ eter: 1 });
  });

  it('recorre a Ícor quando não há mais nada a devolver', () => {
    const jogador = { fichas: { eter: 1, oceano: 0, terra: 0, chama: 0, sombra: 0, icor: 3, chronos: 0 } };
    const devolvido = devolucaoAutomatica(jogador, 3);
    expect(devolvido).toEqual({ eter: 1, icor: 2 });
  });
});

describe('santuarioAutomatico (Seção 17.6)', () => {
  it('concede sempre a primeira opção da lista', () => {
    expect(santuarioAutomatico({ opcoes: ['s2', 's5'] })).toBe('s2');
  });
});
