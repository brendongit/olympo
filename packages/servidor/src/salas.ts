// Registro de salas em memória — Seção 17.7 da spec (deploy no Render,
// plano gratuito). Sem Redis nem Postgres: cada instância guarda suas salas
// num Map. Uma sala é perdida se o serviço reinicia ou hiberna sem ninguém
// conectado — aceitável para um projeto de testes jogado esporadicamente.

import type { Acao, EstadoJogo } from '@olympos/motor';
import { reduzir, type ResultadoAcao } from '@olympos/motor';

export const TEMPO_LIMPEZA_SALA_VAZIA_MS = 5 * 60_000; // 5 minutos (Seção 17.6)

export interface JogadorNaSala {
  id: string;
  nome: string;
  avatar: string;
  /** null enquanto o jogador está desconectado. */
  socketId: string | null;
}

export interface Sala {
  codigo: string;
  jogadores: Map<string, JogadorNaSala>; // por jogadorId, ordem de entrada == ordem de turno
  anfitriaoId: string | null;
  /** null enquanto a sala está no SAGUÃO — Seção 17.2. */
  partida: EstadoJogo | null;
  /** Incrementada a cada ação aceita — Seção 17.4. */
  versao: number;
  /** `${jogadorId}:${nonce}` já processados, pra descartar duplicatas (Seção 17.1). */
  noncesVistos: Set<string>;
  criadaEm: number;
  timerLimpeza: ReturnType<typeof setTimeout> | null;
  /** Timer do turno atual (Seção 17.6) — dispara a ação automática se ninguém agir. */
  timerTurno: ReturnType<typeof setTimeout> | null;
  /** jogadorIds que votaram para encerrar a partida por abandono (Seção 17.6). */
  votosEncerrar: Set<string>;
}

function algumJogadorConectado(sala: Sala): boolean {
  for (const jogador of sala.jogadores.values()) {
    if (jogador.socketId !== null) return true;
  }
  return false;
}

/**
 * Registro de salas do processo. Não sobrevive a um reinício do servidor —
 * é exatamente o comportamento esperado (Seção 17.7).
 */
export class RegistroDeSalas {
  private salas = new Map<string, Sala>();

  criar(codigo: string): Sala {
    if (this.salas.has(codigo)) {
      throw new Error(`Sala ${codigo} já existe`);
    }
    const sala: Sala = {
      codigo,
      jogadores: new Map(),
      anfitriaoId: null,
      partida: null,
      versao: 0,
      noncesVistos: new Set(),
      criadaEm: Date.now(),
      timerLimpeza: null,
      timerTurno: null,
      votosEncerrar: new Set(),
    };
    this.salas.set(codigo, sala);
    return sala;
  }

  obter(codigo: string): Sala | undefined {
    return this.salas.get(codigo);
  }

  tamanho(): number {
    return this.salas.size;
  }

  adicionarJogador(codigo: string, jogador: JogadorNaSala): void {
    const sala = this.salas.get(codigo);
    if (!sala) throw new Error(`Sala ${codigo} não existe`);
    sala.jogadores.set(jogador.id, jogador);
    if (sala.anfitriaoId === null) sala.anfitriaoId = jogador.id;
    this.cancelarLimpezaPendente(sala);
  }

  /**
   * Tira o jogador da sala — só faz sentido no SAGUÃO (Seção 17.2): depois
   * que a partida começa, o motor não tem noção de "jogador removido", então
   * desconexão em jogo só marca `conectado = false` (ver `index.ts`), nunca
   * chama este método. Se o removido era o anfitrião, transfere pro próximo
   * jogador da lista (Seção 17.6: "Anfitrião sai do saguão → transferido ao
   * próximo").
   */
  removerJogador(codigo: string, jogadorId: string): void {
    const sala = this.salas.get(codigo);
    if (!sala) return;
    sala.jogadores.delete(jogadorId);
    if (sala.anfitriaoId === jogadorId) {
      sala.anfitriaoId = sala.jogadores.keys().next().value ?? null;
    }
  }

  /** Guarda o estado inicial da partida — Seção 17.2, transição SAGUÃO → EM_ANDAMENTO. */
  iniciarPartida(codigo: string, estado: EstadoJogo): void {
    const sala = this.salas.get(codigo);
    if (!sala) throw new Error(`Sala ${codigo} não existe`);
    sala.partida = estado;
    sala.versao = 0;
  }

  /**
   * Aplica uma ação com o MESMO motor puro usado no cliente — o servidor é
   * a autoridade (Seção 15.1/17.1). Em caso de sucesso, incrementa `versao`.
   * Nunca muta nada em caso de rejeição.
   */
  aplicarAcao(codigo: string, acao: Acao): ResultadoAcao {
    const sala = this.salas.get(codigo);
    if (!sala || !sala.partida) {
      return { ok: false, motivo: 'Sala sem partida em andamento' };
    }
    const resultado = reduzir(sala.partida, acao);
    if (resultado.ok) {
      sala.partida = resultado.valor;
      sala.versao += 1;
    }
    return resultado;
  }

  /** Dedup de ação — Seção 17.1: "Toda ação carrega um nonce; o servidor descarta duplicatas." */
  nonceJaVisto(codigo: string, jogadorId: string, nonce: string): boolean {
    const sala = this.salas.get(codigo);
    if (!sala) return false;
    const chave = `${jogadorId}:${nonce}`;
    if (sala.noncesVistos.has(chave)) return true;
    sala.noncesVistos.add(chave);
    return false;
  }

  /** Chame sempre que um socket se conecta/reconecta a uma sala já existente. */
  marcarConectado(codigo: string, jogadorId: string, socketId: string): void {
    const sala = this.salas.get(codigo);
    if (!sala) return;
    const jogador = sala.jogadores.get(jogadorId);
    if (jogador) jogador.socketId = socketId;
    this.cancelarLimpezaPendente(sala);
  }

  /**
   * Chame quando um socket desconecta. Se era o último jogador conectado da
   * sala, agenda a remoção em `TEMPO_LIMPEZA_SALA_VAZIA_MS` — cancelada se
   * alguém reconectar antes disso (decisão 6 do deploy no Render).
   */
  marcarDesconectado(codigo: string, jogadorId: string): void {
    const sala = this.salas.get(codigo);
    if (!sala) return;
    const jogador = sala.jogadores.get(jogadorId);
    if (jogador) jogador.socketId = null;

    if (algumJogadorConectado(sala)) return;
    if (sala.timerLimpeza) return; // já agendado

    sala.timerLimpeza = setTimeout(() => {
      const salaAtual = this.salas.get(codigo);
      if (salaAtual && !algumJogadorConectado(salaAtual)) {
        this.salas.delete(codigo);
      }
    }, TEMPO_LIMPEZA_SALA_VAZIA_MS);

    // Um timer de limpeza pendente nunca deve, sozinho, impedir o processo
    // de encerrar (ex.: durante testes ou um shutdown gracioso).
    sala.timerLimpeza.unref?.();
  }

  private cancelarLimpezaPendente(sala: Sala): void {
    if (sala.timerLimpeza) {
      clearTimeout(sala.timerLimpeza);
      sala.timerLimpeza = null;
    }
  }
}
