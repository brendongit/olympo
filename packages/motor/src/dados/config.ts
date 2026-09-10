// Seção 14.6 — Configuração por número de jogadores

import type { Ficha } from '../tipos.js';

export const CONFIG_PARTIDA = {
  2: { fichasPorEssencia: 4, chronos: 2, santuarios: 2 },
  3: { fichasPorEssencia: 5, chronos: 3, santuarios: 3 },
  4: { fichasPorEssencia: 7, chronos: 4, santuarios: 4 },
} as const;

export const ICOR_TOTAL = 5; // sempre 5, independente do nº de jogadores
export const KLEOS_KERAUNOS = 16; // ⚠️ 16, não 15
export const LIMITE_FICHAS = 10; // inclui ícor E chronos
export const MAX_PRESSAGIOS = 3;
export const MIN_PARA_DUPLA = 4; // pilha precisa ter ≥4 para colher 2 iguais
export const CARTAS_VISIVEIS = 4; // por fileira
export const ARGO_LIMIAR = 3; // símbolos mínimos para tomar Os Argonautas
export const KLEOS_SANTUARIO = 3;
export const KLEOS_ARGONAUTAS = 3;
export const MAX_CHRONOS_POR_JOGADOR = 1;
export const DURACAO_TURNO_MS = 90_000; // Seção 17.6, padrão 90s

/** Fichas que NÃO podem ser obtidas pelas Ações A e B. */
export const FICHAS_FORA_DO_MERCADO: readonly Ficha[] = ['icor', 'chronos'];

/** Fichas que NÃO podem ser devolvidas no descarte do limite de 10. */
export const FICHAS_NAO_DEVOLVIVEIS: readonly Ficha[] = ['chronos'];
