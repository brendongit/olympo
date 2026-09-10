// Store Zustand: só chama funções do @olympos/motor (reduzir, criarPartida,
// verificarInvariantes, projetarPara). Nenhuma lógica de regra vive aqui —
// esta camada apenas guarda o EstadoJogo e repassa ações.

import { create } from 'zustand';
import type { Acao, EstadoJogo, EstadoVisivel } from '@olympos/motor';
import { criarPartida, projetarPara, reduzir, verificarInvariantes } from '@olympos/motor';

const AVATARES = ['🦉', '🔱', '🏹', '🛡️'];

function gerarSeed(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function checarInvariantesEmDev(estado: EstadoJogo, contexto: string): void {
  if (!import.meta.env.DEV) return;
  const violacoes = verificarInvariantes(estado);
  if (violacoes.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`[OLYMPOS] Invariante violado (${contexto})`, violacoes);
  }
}

interface LojaPartida {
  estado: EstadoJogo | null;
  ultimoErro: string | null;
  iniciarPartida: (nomes: string[]) => void;
  despachar: (acao: Acao) => void;
  limparErro: () => void;
  reiniciar: () => void;
}

export const usePartida = create<LojaPartida>((set, get) => ({
  estado: null,
  ultimoErro: null,

  iniciarPartida: (nomes) => {
    const estado = criarPartida({
      partidaId: gerarSeed(),
      seed: gerarSeed(),
      jogadores: nomes.map((nome, i) => ({
        id: `jogador-${i + 1}`,
        nome,
        avatar: AVATARES[i % AVATARES.length]!,
      })),
    });
    checarInvariantesEmDev(estado, 'criarPartida');
    set({ estado, ultimoErro: null });
  },

  despachar: (acao) => {
    const atual = get().estado;
    if (!atual) return;

    const resultado = reduzir(atual, acao);
    if (!resultado.ok) {
      set({ ultimoErro: resultado.motivo });
      return;
    }

    checarInvariantesEmDev(resultado.valor, `após ${acao.tipo}`);
    set({ estado: resultado.valor, ultimoErro: null });
  },

  limparErro: () => set({ ultimoErro: null }),

  reiniciar: () => set({ estado: null, ultimoErro: null }),
}));

/**
 * Estado projetado (Seção 16) do ponto de vista de quem tem a vez.
 *
 * Mesmo em hotseat local — todos na mesma tela — um Presságio reservado às
 * cegas do topo do baralho continua oculto para quem não é o dono: é a
 * mesma regra de "não estrague a surpresa do outro jogador" que vale em
 * qualquer jogo de tabuleiro físico com cartas reservadas viradas para baixo.
 */
export function useEstadoVisivel(): EstadoVisivel | null {
  const estado = usePartida((s) => s.estado);
  if (!estado) return null;
  const jogadorDaVez = estado.jogadores[estado.jogadorAtual]!;
  return projetarPara(estado, jogadorDaVez.id);
}
