import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RegistroDeSalas, TEMPO_LIMPEZA_SALA_VAZIA_MS } from './salas.js';

function jogador(id: string, socketId: string | null): { id: string; nome: string; avatar: string; socketId: string | null } {
  return { id, nome: `Jogador ${id}`, avatar: '🦉', socketId };
}

describe('RegistroDeSalas (Seção 17.7 — limpeza de salas vazias)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cria e recupera uma sala pelo código', () => {
    const registro = new RegistroDeSalas();
    registro.criar('OLY-ABC');
    expect(registro.obter('OLY-ABC')?.codigo).toBe('OLY-ABC');
    expect(registro.tamanho()).toBe(1);
  });

  it('não descarta a sala se ainda houver algum jogador conectado', () => {
    const registro = new RegistroDeSalas();
    registro.criar('OLY-1');
    registro.adicionarJogador('OLY-1', jogador('j1', 's1'));
    registro.adicionarJogador('OLY-1', jogador('j2', 's2'));

    registro.marcarDesconectado('OLY-1', 'j1'); // j2 continua conectado

    vi.advanceTimersByTime(TEMPO_LIMPEZA_SALA_VAZIA_MS + 1000);
    expect(registro.obter('OLY-1')).toBeDefined();
  });

  it('descarta a sala 5 minutos depois de o último jogador desconectar', () => {
    const registro = new RegistroDeSalas();
    registro.criar('OLY-2');
    registro.adicionarJogador('OLY-2', jogador('j1', 's1'));

    registro.marcarDesconectado('OLY-2', 'j1');

    vi.advanceTimersByTime(TEMPO_LIMPEZA_SALA_VAZIA_MS - 1);
    expect(registro.obter('OLY-2')).toBeDefined(); // ainda dentro da janela

    vi.advanceTimersByTime(2);
    expect(registro.obter('OLY-2')).toBeUndefined(); // passou dos 5 minutos
  });

  it('reconectar antes dos 5 minutos cancela a limpeza', () => {
    const registro = new RegistroDeSalas();
    registro.criar('OLY-3');
    registro.adicionarJogador('OLY-3', jogador('j1', 's1'));

    registro.marcarDesconectado('OLY-3', 'j1');
    vi.advanceTimersByTime(TEMPO_LIMPEZA_SALA_VAZIA_MS - 1000);

    registro.marcarConectado('OLY-3', 'j1', 's1-novo');

    vi.advanceTimersByTime(TEMPO_LIMPEZA_SALA_VAZIA_MS + 1000);
    expect(registro.obter('OLY-3')).toBeDefined(); // o timer antigo foi cancelado
  });

  it('desconectar de novo depois de reconectar reinicia a contagem de 5 minutos', () => {
    const registro = new RegistroDeSalas();
    registro.criar('OLY-4');
    registro.adicionarJogador('OLY-4', jogador('j1', 's1'));

    registro.marcarDesconectado('OLY-4', 'j1');
    vi.advanceTimersByTime(TEMPO_LIMPEZA_SALA_VAZIA_MS - 1000);
    registro.marcarConectado('OLY-4', 'j1', 's1-novo');
    registro.marcarDesconectado('OLY-4', 'j1');

    // Só 1s do timer original tinha passado; a nova contagem começa do zero.
    vi.advanceTimersByTime(TEMPO_LIMPEZA_SALA_VAZIA_MS - 1000);
    expect(registro.obter('OLY-4')).toBeDefined();

    vi.advanceTimersByTime(1001);
    expect(registro.obter('OLY-4')).toBeUndefined();
  });

  it('sala com múltiplos jogadores só é descartada quando o último também some', () => {
    const registro = new RegistroDeSalas();
    registro.criar('OLY-5');
    registro.adicionarJogador('OLY-5', jogador('j1', 's1'));
    registro.adicionarJogador('OLY-5', jogador('j2', 's2'));

    registro.marcarDesconectado('OLY-5', 'j1');
    vi.advanceTimersByTime(TEMPO_LIMPEZA_SALA_VAZIA_MS + 1000);
    expect(registro.obter('OLY-5')).toBeDefined(); // j2 ainda conectado

    registro.marcarDesconectado('OLY-5', 'j2');
    vi.advanceTimersByTime(TEMPO_LIMPEZA_SALA_VAZIA_MS + 1000);
    expect(registro.obter('OLY-5')).toBeUndefined();
  });
});
