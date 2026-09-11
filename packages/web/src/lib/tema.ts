// Seção 2 (glossário) e Seção 18 (acessibilidade): cada essência tem
// ícone + cor + posição fixa. Nunca use só a cor como canal de informação.

import type { Essencia, Ficha } from '@olympos/motor';

export interface InfoEssencia {
  rotulo: string;
  icone: string;
  corTexto: string;
  corFundo: string;
  corBorda: string;
  /** Seção 20 — textura distinta por essência pro modo alto contraste, além de cor+ícone. CSS `background-image`. */
  padraoAltoContraste?: string;
}

export const INFO_FICHA: Record<Ficha, InfoEssencia> = {
  eter: {
    rotulo: 'Éter',
    icone: '⚡',
    corTexto: 'text-amber-950',
    corFundo: 'bg-amber-100',
    corBorda: 'border-amber-300',
    padraoAltoContraste: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.25) 0 3px, transparent 3px 8px)',
  },
  oceano: {
    rotulo: 'Oceano',
    icone: '🌊',
    corTexto: 'text-white',
    corFundo: 'bg-blue-800',
    corBorda: 'border-blue-400',
    padraoAltoContraste: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.3) 0 3px, transparent 3px 9px)',
  },
  terra: {
    rotulo: 'Terra',
    icone: '🌿',
    corTexto: 'text-white',
    corFundo: 'bg-green-800',
    corBorda: 'border-green-400',
    padraoAltoContraste: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0 3px, transparent 3px 9px)',
  },
  chama: {
    rotulo: 'Chama',
    icone: '🔥',
    corTexto: 'text-white',
    corFundo: 'bg-red-800',
    corBorda: 'border-red-400',
    padraoAltoContraste: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.3) 0 3px, transparent 3px 8px)',
  },
  sombra: {
    rotulo: 'Sombra',
    icone: '🌑',
    corTexto: 'text-white',
    corFundo: 'bg-violet-950',
    corBorda: 'border-violet-500',
    padraoAltoContraste:
      'radial-gradient(rgba(255,255,255,0.35) 1.2px, transparent 1.2px)',
  },
  icor: {
    rotulo: 'Ícor',
    icone: '💧',
    corTexto: 'text-amber-950',
    corFundo: 'bg-yellow-400',
    corBorda: 'border-yellow-200',
  },
  chronos: {
    rotulo: 'Chronos',
    icone: '⧗',
    corTexto: 'text-stone-100',
    corFundo: 'bg-stone-700',
    corBorda: 'border-stone-400',
  },
};

/**
 * Estilo inline pro modo de alto contraste (Seção 20) — devolve `{}` quando
 * desligado ou quando a ficha não tem padrão (Ícor/Chronos, fora do
 * mercado, já suficientemente distintos por não aparecerem ao lado de
 * essências coloridas). `backgroundSize` casa com o espaçamento do
 * gradiente de cada essência pra o padrão não esticar feio em botões de
 * tamanhos diferentes.
 */
export function estiloAltoContraste(f: Ficha, ativo: boolean): React.CSSProperties {
  if (!ativo) return {};
  const padrao = INFO_FICHA[f].padraoAltoContraste;
  if (!padrao) return {};
  return f === 'sombra'
    ? { backgroundImage: padrao, backgroundSize: '6px 6px' }
    : { backgroundImage: padrao };
}

// Seção 2: ordem canônica das essências, usar sempre em toda UI.
export const ORDEM_ESSENCIAS: Essencia[] = ['eter', 'oceano', 'terra', 'chama', 'sombra'];
// Ícor e Chronos são "fora do mercado" (Seção 3.1): nunca clicáveis para
// colheita, sempre exibidos por último e visualmente separados.
export const ORDEM_FICHAS: Ficha[] = [...ORDEM_ESSENCIAS, 'icor', 'chronos'];
export const FICHAS_FORA_DO_MERCADO_UI: Ficha[] = ['icor', 'chronos'];

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
