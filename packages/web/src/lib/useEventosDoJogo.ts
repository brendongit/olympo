// Consome os eventos novos da store (Seção 17.5) sem duplicar a lógica de
// diff em cada componente que reage a um tipo de evento específico
// (overlays, anúncios aria-live). `eventosVersao` incrementa a cada
// atualização — mesmo quando `eventosNovos` está vazio — e é a única
// dependência do efeito: `eventosNovos` é substituído (nunca acumulado) a
// cada atualização da store, então rodar de novo só quando a versão muda
// evita reprocessar os mesmos eventos em re-renders por outro motivo.

import { useEffect } from 'react';
import type { EventoJogo } from '@olympos/motor';
import { usePartida } from '../loja/usePartida.js';

export function useEventosDoJogo(aoReceber: (evento: EventoJogo) => void): void {
  const eventosNovos = usePartida((s) => s.eventosNovos);
  const eventosVersao = usePartida((s) => s.eventosVersao);

  useEffect(() => {
    for (const evento of eventosNovos) aoReceber(evento);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventosVersao]);
}
