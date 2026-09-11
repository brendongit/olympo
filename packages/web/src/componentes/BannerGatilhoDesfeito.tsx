// Seção 19.8 — "Gatilho desfeito": raro e confuso, precisa de uma faixa
// distinta da última rodada (tom de alívio/tensão, âmbar em vez de
// vermelho) explicando em uma frase. Não existe campo persistente pra isso
// no estado (o gatilho simplesmente volta a EM_ANDAMENTO) — é
// necessariamente reativo ao evento GATILHO_DESFEITO, com timeout próprio.

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEventosDoJogo } from '../lib/useEventosDoJogo.js';

const DURACAO_MS = 6000;

export function BannerGatilhoDesfeito() {
  const [visivel, setVisivel] = useState(false);

  useEventosDoJogo((evento) => {
    if (evento.t === 'GATILHO_DESFEITO') setVisivel(true);
  });

  useEffect(() => {
    if (!visivel) return;
    const id = setTimeout(() => setVisivel(false), DURACAO_MS);
    return () => clearTimeout(id);
  }, [visivel]);

  return (
    <AnimatePresence>
      {visivel && (
        <motion.div
          role="alert"
          aria-live="assertive"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={() => setVisivel(false)}
          className="shrink-0 cursor-pointer overflow-hidden bg-amber-700 px-3 py-1.5 text-center text-xs font-semibold text-amber-50"
        >
          O Keraunos se desfez. O jogo continua.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
