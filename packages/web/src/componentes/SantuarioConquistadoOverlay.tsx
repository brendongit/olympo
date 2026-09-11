// Seção 19.8 — "Santuário conquistado": retrato do patrono em tela cheia
// por 1,2s, pulável com toque. Reativo ao evento SANTUARIO.

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { EventoJogo } from '@olympos/motor';
import { SANTUARIO_POR_ID } from '@olympos/motor';
import { narrarEvento } from '../lib/eventos.js';
import { useEventosDoJogo } from '../lib/useEventosDoJogo.js';
import { useFecharComEsc } from '../lib/useFecharComEsc.js';
import { usePartida } from '../loja/usePartida.js';

const DURACAO_MS = 1200;

export function SantuarioConquistadoOverlay() {
  const jogadores = usePartida((s) => s.estadoVisivel?.jogadores ?? []);
  const [evento, setEvento] = useState<Extract<EventoJogo, { t: 'SANTUARIO' }> | null>(null);

  useEventosDoJogo((e) => {
    if (e.t === 'SANTUARIO') setEvento(e);
  });

  useEffect(() => {
    if (!evento) return;
    const id = setTimeout(() => setEvento(null), DURACAO_MS);
    return () => clearTimeout(id);
  }, [evento]);

  useFecharComEsc(() => setEvento(null));

  return (
    <AnimatePresence>
      {evento && (
        <motion.div
          role="status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setEvento(null)}
          className="fixed inset-0 z-[60] flex cursor-pointer flex-col items-center justify-center gap-2 bg-stone-950/95"
        >
          <span className="text-6xl" aria-hidden="true">
            ⛩
          </span>
          <h2 className="font-serif text-3xl font-bold text-amber-200">
            {SANTUARIO_POR_ID[evento.santuarioId]?.nome ?? 'Santuário'}
          </h2>
          <p className="text-lg text-stone-300">{narrarEvento(evento, jogadores)}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
