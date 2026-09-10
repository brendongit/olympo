// Seção 17.7 (deploy no Render, plano gratuito) — decisão 4.
//
// Envolva com este componente qualquer fluxo que precise do servidor (ex.:
// o saguão online). Os filhos só são renderizados — e portanto só podem
// chamar `conectarSocket()` — depois que GET /health responder.

import type { ReactNode } from 'react';
import { useServidorAcordado } from './useServidorAcordado.js';

interface TelaDespertandoProps {
  children: ReactNode;
}

export function TelaDespertando({ children }: TelaDespertandoProps) {
  const { pronto, segundos, erroDeConfiguracao } = useServidorAcordado();

  if (erroDeConfiguracao) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950 p-6">
        <div className="w-full max-w-md rounded-xl border border-red-900 bg-stone-900 p-8 text-center shadow-xl">
          <p className="text-sm text-red-300">{erroDeConfiguracao}</p>
        </div>
      </div>
    );
  }

  if (!pronto) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950 p-6">
        <div className="w-full max-w-md rounded-xl border border-stone-800 bg-stone-900 p-8 text-center shadow-xl">
          <h1 className="mb-4 font-serif text-2xl font-bold tracking-wide text-amber-200">Acordando o servidor…</h1>
          <p className="mb-2 text-4xl font-mono tabular-nums text-amber-300">{segundos}s</p>
          <p className="text-sm leading-relaxed text-stone-400">
            O servidor hiberna quando ninguém está jogando, para caber no plano gratuito. A primeira conexão do dia
            pode levar cerca de 1 minuto — as próximas são instantâneas enquanto alguém estiver na sala.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
