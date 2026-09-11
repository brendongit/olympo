import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { criarPartida } from '@olympos/motor';
import { RegistroDeSalas, TEMPO_LIMPEZA_SALA_VAZIA_MS } from './salas.js';

function jogador(id: string, socketId: string | null): { id: string; nome: string; avatar: string; socketId: string | null } {
  return { id, nome: `Jogador ${id}`, avatar: '🦉', socketId };
}

function partidaDeDoisJogadores() {
  return criarPartida({
    partidaId: 'p1',
    seed: 'seed-fixa',
    jogadores: [
      { id: 'j1', nome: 'Helena', avatar: '🦉' },
      { id: 'j2', nome: 'Rafael', avatar: '🔱' },
    ],
  });
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

describe('RegistroDeSalas — anfitrião e saguão (Seção 17.2/17.6)', () => {
  it('o primeiro jogador a entrar vira anfitrião', () => {
    const registro = new RegistroDeSalas();
    registro.criar('OLY-6');
    registro.adicionarJogador('OLY-6', jogador('j1', 's1'));
    registro.adicionarJogador('OLY-6', jogador('j2', 's2'));

    expect(registro.obter('OLY-6')?.anfitriaoId).toBe('j1');
  });

  it('remover o anfitrião transfere para o próximo jogador da sala', () => {
    const registro = new RegistroDeSalas();
    registro.criar('OLY-7');
    registro.adicionarJogador('OLY-7', jogador('j1', 's1'));
    registro.adicionarJogador('OLY-7', jogador('j2', 's2'));

    registro.removerJogador('OLY-7', 'j1');

    expect(registro.obter('OLY-7')?.anfitriaoId).toBe('j2');
    expect(registro.obter('OLY-7')?.jogadores.has('j1')).toBe(false);
  });

  it('remover um jogador que não é o anfitrião não muda o anfitrião', () => {
    const registro = new RegistroDeSalas();
    registro.criar('OLY-8');
    registro.adicionarJogador('OLY-8', jogador('j1', 's1'));
    registro.adicionarJogador('OLY-8', jogador('j2', 's2'));

    registro.removerJogador('OLY-8', 'j2');

    expect(registro.obter('OLY-8')?.anfitriaoId).toBe('j1');
  });
});

describe('RegistroDeSalas — partida em andamento (Seção 17.1)', () => {
  it('iniciarPartida guarda o estado inicial e zera a versão', () => {
    const registro = new RegistroDeSalas();
    registro.criar('OLY-9');
    const estado = partidaDeDoisJogadores();

    registro.iniciarPartida('OLY-9', estado);

    const sala = registro.obter('OLY-9')!;
    expect(sala.partida).toBe(estado);
    expect(sala.versao).toBe(0);
  });

  it('aplicarAcao usa o mesmo motor puro do cliente e incrementa a versão em caso de sucesso', () => {
    const registro = new RegistroDeSalas();
    registro.criar('OLY-10');
    const estado = partidaDeDoisJogadores();
    registro.iniciarPartida('OLY-10', estado);

    const jogadorDaVez = estado.jogadores[estado.jogadorAtual]!.id;
    const resultado = registro.aplicarAcao('OLY-10', {
      tipo: 'COLHER_DIFERENTES',
      jogadorId: jogadorDaVez,
      essencias: ['eter', 'oceano', 'terra'],
    });

    expect(resultado.ok).toBe(true);
    expect(registro.obter('OLY-10')?.versao).toBe(1);
  });

  it('aplicarAcao rejeita ação ilegal sem mutar a partida nem a versão', () => {
    const registro = new RegistroDeSalas();
    registro.criar('OLY-11');
    const estado = partidaDeDoisJogadores();
    registro.iniciarPartida('OLY-11', estado);

    const jogadorForaDaVez = estado.jogadores[1 - estado.jogadorAtual]!.id;
    const resultado = registro.aplicarAcao('OLY-11', { tipo: 'PASSAR', jogadorId: jogadorForaDaVez });

    expect(resultado.ok).toBe(false);
    const sala = registro.obter('OLY-11')!;
    expect(sala.partida).toBe(estado);
    expect(sala.versao).toBe(0);
  });

  it('aplicarAcao sem partida em andamento retorna erro', () => {
    const registro = new RegistroDeSalas();
    registro.criar('OLY-12');

    const resultado = registro.aplicarAcao('OLY-12', { tipo: 'PASSAR', jogadorId: 'quem-seja' });

    expect(resultado.ok).toBe(false);
  });

  it('nonceJaVisto descarta duplicatas e aceita nonces diferentes', () => {
    const registro = new RegistroDeSalas();
    registro.criar('OLY-13');

    expect(registro.nonceJaVisto('OLY-13', 'j1', 'n1')).toBe(false);
    expect(registro.nonceJaVisto('OLY-13', 'j1', 'n1')).toBe(true); // duplicata
    expect(registro.nonceJaVisto('OLY-13', 'j1', 'n2')).toBe(false); // nonce novo
    expect(registro.nonceJaVisto('OLY-13', 'j2', 'n1')).toBe(false); // mesmo nonce, jogador diferente
  });
});
