// Seção 16 — Informação pública vs. privada.
//
// O servidor mantém `EstadoJogo` completo e envia a cada cliente uma projeção
// `EstadoVisivel` diferente. Regra inegociável (ver CLAUDE.md, Seção 11 da
// spec): o `cartaId` de um Presságio oculto NUNCA sai do servidor para outros
// jogadores — nem no estado, nem no histórico de eventos.

import type { EstadoJogo, EstadoVisivel, EventoJogo, JogadorVisivel } from './tipos.js';

function redigirEvento(evento: EventoJogo, espectadorId: string): EventoJogo {
  if (evento.t === 'RESERVOU' && evento.oculto && evento.jogadorId !== espectadorId) {
    return { ...evento, cartaId: null };
  }
  return evento;
}

export function projetarPara(e: EstadoJogo, espectadorId: string): EstadoVisivel {
  const jogadores: JogadorVisivel[] = e.jogadores.map((j) => ({
    ...j,
    pressagios: j.pressagios.map((p) =>
      p.oculto && j.id !== espectadorId ? { cartaId: null, oculto: true, nivel: p.nivel } : p,
    ),
  }));

  return {
    ...e,
    seed: e.fase === 'ENCERRADO' ? e.seed : undefined,
    baralhos: {
      1: e.baralhos[1].length,
      2: e.baralhos[2].length,
      3: e.baralhos[3].length,
    },
    jogadores,
    historico: e.historico.map((evento) => redigirEvento(evento, espectadorId)),
  };
}
