// Preferências de acessibilidade (Seção 19.8/20) — persistidas localmente,
// nada a ver com estado de partida. Store separada porque é escopo de
// aparelho/navegador, não de jogo.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LojaPreferencias {
  /** 'auto' respeita prefers-reduced-motion do sistema; 'sempre' força reduzido mesmo se o SO não pedir. */
  animacoesReduzidas: 'auto' | 'sempre';
  altoContraste: boolean;
  alternarAnimacoesReduzidas: () => void;
  alternarAltoContraste: () => void;
}

export const usePreferencias = create<LojaPreferencias>()(
  persist(
    (set, get) => ({
      animacoesReduzidas: 'auto',
      altoContraste: false,
      alternarAnimacoesReduzidas: () =>
        set({ animacoesReduzidas: get().animacoesReduzidas === 'auto' ? 'sempre' : 'auto' }),
      alternarAltoContraste: () => set({ altoContraste: !get().altoContraste }),
    }),
    { name: 'olympos:preferencias' },
  ),
);
