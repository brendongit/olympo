// Contador do timer de turno (Seção 17.6). Em hotseat local `prazoDoTurno`
// nunca é estampado (fica sempre null — só o servidor estampa marcas de
// tempo reais), então o componente simplesmente não renderiza nada lá.

import { useEffect, useState } from 'react';
import type { EstadoVisivel } from '@olympos/motor';

export function ContadorDeTurno({ estadoVisivel }: { estadoVisivel: EstadoVisivel }) {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (estadoVisivel.prazoDoTurno === null) return;
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [estadoVisivel.prazoDoTurno]);

  if (estadoVisivel.prazoDoTurno === null) return null;

  const restante = Math.max(0, Math.round((estadoVisivel.prazoDoTurno - agora) / 1000));
  const critico = restante <= 15;

  return (
    <span
      className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold tabular-nums ${
        critico ? 'bg-red-800 text-red-100' : 'bg-stone-800 text-stone-300'
      }`}
      title="Tempo restante do turno"
    >
      ⏱ {restante}s
    </span>
  );
}
