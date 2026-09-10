// Seção 16 — só informação pública. Usa o EstadoVisivel projetado (não o
// EstadoJogo real) para nunca correr o risco de desenhar o cartaId de um
// presságio oculto alheio.

import type { EstadoVisivel } from '@olympos/motor';
import { DetalhesOponente } from './DetalhesOponente.js';

export function PainelOponentes({ estadoVisivel }: { estadoVisivel: EstadoVisivel }) {
  const idJogadorDaVez = estadoVisivel.jogadores[estadoVisivel.jogadorAtual]!.id;
  const oponentes = estadoVisivel.jogadores.filter((j) => j.id !== idJogadorDaVez);

  return (
    <div className="flex w-full flex-col gap-2 overflow-y-auto">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400">Oponentes</h2>
      {oponentes.map((j) => (
        <div key={j.id} className="rounded-lg border border-stone-800 bg-stone-900/60 p-2">
          <DetalhesOponente jogador={j} donoArgonautasId={estadoVisivel.argonautas.dono} />
        </div>
      ))}
    </div>
  );
}
