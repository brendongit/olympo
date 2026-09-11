// Seção 20 — "setas dentro da zona". Move o foco entre os botões
// habilitados de um grupo (reservatório, fileira de cartas) com as setas,
// Home/End vão pras pontas. `Enter`/`Space` pra agir já funcionam de graça
// em qualquer `<button>` nativo — não precisa de handler próprio aqui.
//
// Escopo deliberado: só move o foco por seta. Não gerencia `tabIndex`
// (roving tabindex completo faria o Tab pular a zona inteira de uma vez em
// vez de passar por cada botão) — pra um app deste tamanho, o ganho não
// compensa a complexidade extra de sincronizar o índice "ativo" com toda
// mudança externa de estado (fichas somem, cartas trocam).

import { useCallback, useRef } from 'react';

export function useNavegacaoPorSetas<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);

  const aoTeclar = useCallback((e: React.KeyboardEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const focaveis = Array.from(container.querySelectorAll<HTMLElement>('button:not(:disabled)'));
    if (focaveis.length === 0) return;
    const atual = focaveis.indexOf(document.activeElement as HTMLElement);

    let proximo: number;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        proximo = atual < 0 ? 0 : (atual + 1) % focaveis.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        proximo = atual < 0 ? focaveis.length - 1 : (atual - 1 + focaveis.length) % focaveis.length;
        break;
      case 'Home':
        proximo = 0;
        break;
      case 'End':
        proximo = focaveis.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    focaveis[proximo]?.focus();
  }, []);

  return { containerRef, aoTeclar };
}
