// Seção 2 (glossário) e Seção 18 (acessibilidade): cada essência tem
// ícone + cor + posição fixa. Nunca use só a cor como canal de informação.

import type { Essencia, Ficha } from '@olympos/motor';

export interface InfoEssencia {
  rotulo: string;
  icone: string;
  corTexto: string;
  corFundo: string;
  corBorda: string;
}

export const INFO_FICHA: Record<Ficha, InfoEssencia> = {
  eter: {
    rotulo: 'Éter',
    icone: '⚡',
    corTexto: 'text-amber-950',
    corFundo: 'bg-amber-100',
    corBorda: 'border-amber-300',
  },
  oceano: {
    rotulo: 'Oceano',
    icone: '🌊',
    corTexto: 'text-white',
    corFundo: 'bg-blue-800',
    corBorda: 'border-blue-400',
  },
  terra: {
    rotulo: 'Terra',
    icone: '🌿',
    corTexto: 'text-white',
    corFundo: 'bg-green-800',
    corBorda: 'border-green-400',
  },
  chama: {
    rotulo: 'Chama',
    icone: '🔥',
    corTexto: 'text-white',
    corFundo: 'bg-red-800',
    corBorda: 'border-red-400',
  },
  sombra: {
    rotulo: 'Sombra',
    icone: '🌑',
    corTexto: 'text-white',
    corFundo: 'bg-violet-950',
    corBorda: 'border-violet-500',
  },
  icor: {
    rotulo: 'Ícor',
    icone: '💧',
    corTexto: 'text-amber-950',
    corFundo: 'bg-yellow-400',
    corBorda: 'border-yellow-200',
  },
};

// Seção 2: ordem canônica das essências, usar sempre em toda UI.
export const ORDEM_ESSENCIAS: Essencia[] = ['eter', 'oceano', 'terra', 'chama', 'sombra'];
export const ORDEM_FICHAS: Ficha[] = [...ORDEM_ESSENCIAS, 'icor'];

export const NOME_NIVEL: Record<1 | 2 | 3, string> = {
  1: 'Relíquias e Presságios',
  2: 'Heróis e Criaturas',
  3: 'Titãs e Primordiais',
};

export const COR_NIVEL: Record<1 | 2 | 3, string> = {
  1: 'border-amber-700', // bronze
  2: 'border-slate-300', // prata
  3: 'border-yellow-400', // ouro
};
