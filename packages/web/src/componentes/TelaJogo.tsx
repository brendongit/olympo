// Layout desktop (Seção 17.3): DEUSES | FILEIRAS + RESERVATÓRIO | OPONENTES,
// com o painel do jogador da vez fixo embaixo.

import type { EstadoJogo } from '@olympos/motor';
import { useEhMobile } from '../lib/useMediaQuery.js';
import { useEstadoVisivel } from '../loja/usePartida.js';
import { FileirasLendas } from './FileirasLendas.js';
import { ModalDescarte } from './ModalDescarte.js';
import { ModalEscolherDeus } from './ModalEscolherDeus.js';
import { PainelDeuses } from './PainelDeuses.js';
import { PainelJogador } from './PainelJogador.js';
import { PainelOponentes } from './PainelOponentes.js';
import { Reservatorio } from './Reservatorio.js';
import { TelaFimDeJogo } from './TelaFimDeJogo.js';
import { TelaJogoMobile } from './TelaJogoMobile.js';

export function TelaJogo({ estado }: { estado: EstadoJogo }) {
  const estadoVisivel = useEstadoVisivel();
  const ehMobile = useEhMobile();

  if (estado.fase === 'ENCERRADO') {
    return <TelaFimDeJogo estado={estado} />;
  }
  if (!estadoVisivel) return null;

  if (ehMobile) {
    return <TelaJogoMobile estado={estado} />;
  }

  const jogadorDaVez = estado.jogadores[estado.jogadorAtual]!;

  return (
    <div className="flex h-screen flex-col bg-stone-950 text-stone-100">
      <header className="flex items-center gap-3 border-b border-stone-800 bg-stone-900 px-4 py-2">
        <h1 className="font-serif text-lg font-bold tracking-wide text-amber-200">OLYMPOS</h1>
        <span className="text-xs text-stone-500">partida local</span>
        <span className="ml-auto text-sm text-stone-300">
          Vez de <span className="font-semibold text-amber-300">{jogadorDaVez.nome}</span>
        </span>
        {estado.fase === 'ULTIMA_RODADA' && (
          <span className="rounded bg-red-800 px-2 py-0.5 text-xs font-semibold text-red-100">
            Última rodada — {estado.jogadores.find((j) => j.id === estado.disparouUltimaRodada)?.nome} atingiu 15
            Kléos
          </span>
        )}
      </header>

      <div className="grid flex-1 grid-cols-[220px_1fr_260px] overflow-hidden">
        <aside className="overflow-y-auto border-r border-stone-800 p-3">
          <PainelDeuses estado={estado} />
        </aside>

        <main className="flex flex-col overflow-hidden p-3">
          <FileirasLendas estado={estado} />
          <Reservatorio key={estado.numeroDoTurno} estado={estado} />
        </main>

        <aside className="overflow-y-auto border-l border-stone-800 p-3">
          <PainelOponentes estadoVisivel={estadoVisivel} />
        </aside>
      </div>

      <PainelJogador estado={estado} />

      {estado.subFase === 'DESCARTANDO' && <ModalDescarte estado={estado} />}
      {estado.subFase === 'ESCOLHENDO_DEUS' && <ModalEscolherDeus estado={estado} />}
    </div>
  );
}
