// Seção 19.8 — "Essência de Chronos obtida": ampulheta cravando, 1s,
// pulável com toque. Puramente reativo ao evento GANHOU_CHRONOS — nenhuma
// decisão de regra acontece aqui.

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { EventoJogo } from '@olympos/motor';
import { narrarEvento } from '../lib/eventos.js';
import { useEventosDoJogo } from '../lib/useEventosDoJogo.js';
import { useFecharComEsc } from '../lib/useFecharComEsc.js';
import { usePartida } from '../loja/usePartida.js';

const DURACAO_MS = 1000;

export function ChronosObtidoOverlay() {
  const jogadores = usePartida((s) => s.estadoVisivel?.jogadores ?? []);
  const [evento, setEvento] = useState<EventoJogo | null>(null);

  useEventosDoJogo((e) => {
    if (e.t === 'GANHOU_CHRONOS') setEvento(e);
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
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.25 }}
          onClick={() => setEvento(null)}
          className="fixed inset-0 z-[60] flex cursor-pointer items-center justify-center bg-black/60"
        >
          <div className="rounded-xl border border-amber-500 bg-stone-900 px-8 py-6 text-center shadow-2xl">
            <div className="mb-2 text-5xl" aria-hidden="true">
              ⧗
            </div>
            <p className="font-serif text-xl font-bold text-amber-200">{narrarEvento(evento, jogadores)}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
