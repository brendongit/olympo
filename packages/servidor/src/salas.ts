// Registro de salas em memória — Seção 17.7 da spec (deploy no Render,
// plano gratuito). Sem Redis nem Postgres: cada instância guarda suas salas
// num Map. Uma sala é perdida se o serviço reinicia ou hiberna sem ninguém
// conectado — aceitável para um projeto de testes jogado esporadicamente.

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
  jogadores: Map<string, JogadorNaSala>; // por jogadorId
  criadaEm: number;
  timerLimpeza: ReturnType<typeof setTimeout> | null;
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
    const sala: Sala = { codigo, jogadores: new Map(), criadaEm: Date.now(), timerLimpeza: null };
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
    this.cancelarLimpezaPendente(sala);
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
