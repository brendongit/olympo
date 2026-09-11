// Seção 20 — "Esc para cancelar". Genérico o bastante pra qualquer modal.

import { useEffect } from 'react';

export function useFecharComEsc(aoFechar: () => void): void {
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') aoFechar();
    }
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);
}
