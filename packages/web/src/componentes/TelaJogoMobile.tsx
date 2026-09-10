// Layout mobile (Seção 19.4, <640px): barra fixa no topo com o Keraunos
// compacto, faixa de oponentes, indicador d'Os Argonautas, acordeão de
// Santuários, fileiras com scroll horizontal, reservatório com alvos de
// toque grandes e o painel do jogador como bottom-sheet.

import type { EstadoJogo } from '@olympos/motor';
import { useEstadoVisivel } from '../loja/usePartida.js';
import { BarraKeraunosCompacta } from './PainelKeraunos.js';
import { AcordeaoSantuarios } from './AcordeaoSantuarios.js';
import { FaixaOponentesMobile } from './FaixaOponentesMobile.js';
import { FileirasLendasMobile } from './FileirasLendasMobile.js';
import { IndicadorArgonautas } from './IndicadorArgonautas.js';
import { ModalDescarte } from './ModalDescarte.js';
import { ModalEscolherSantuario } from './ModalEscolherSantuario.js';
import { PainelJogadorSheet } from './PainelJogadorSheet.js';
import { ReservatorioMobile } from './ReservatorioMobile.js';
import { TelaFimDeJogo } from './TelaFimDeJogo.js';

export function TelaJogoMobile({ estado }: { estado: EstadoJogo }) {
  const estadoVisivel = useEstadoVisivel();

  if (estado.fase === 'ENCERRADO') {
    return <TelaFimDeJogo estado={estado} />;
  }
  if (!estadoVisivel) return null;

  const jogadorDaVez = estado.jogadores[estado.jogadorAtual]!;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-stone-950 text-stone-100">
      <header className="flex min-h-[44px] shrink-0 items-center gap-2 border-b border-stone-800 bg-stone-900 px-3 py-1.5">
        <span className="font-serif text-sm font-bold tracking-wide text-amber-200">OLYMPOS</span>
        <span className="text-xs text-stone-500">{estado.partidaId.slice(0, 8)}</span>
        <span className="ml-auto text-xs text-stone-300">
          Vez de <span className="font-semibold text-amber-300">{jogadorDaVez.nome}</span>
        </span>
        <button
          type="button"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-lg text-stone-400"
          aria-label="Menu"
        >
          ☰
        </button>
      </header>

      <BarraKeraunosCompacta estado={estado} />

      {estado.fase === 'ULTIMA_RODADA' && (
        <div
          className="shrink-0 bg-red-800 px-3 py-1 text-center text-xs font-semibold text-red-100"
          aria-live="assertive"
        >
          Última rodada — {estado.jogadores.find((j) => j.id === estado.disparouUltimaRodada)?.nome} forjou o
          Keraunos
        </div>
      )}

      <FaixaOponentesMobile estadoVisivel={estadoVisivel} />
      <IndicadorArgonautas estado={estado} />
      <AcordeaoSantuarios estado={estado} />

      <main className="flex flex-1 flex-col overflow-hidden px-2 pb-2">
        <FileirasLendasMobile estado={estado} />
        <div className="shrink-0 pb-[172px]">
          <ReservatorioMobile key={estado.numeroDoTurno} estado={estado} />
        </div>
      </main>

      <PainelJogadorSheet estado={estado} />

      {estado.subFase === 'DESCARTANDO' && <ModalDescarte estado={estado} />}
      {estado.subFase === 'ESCOLHENDO_SANTUARIO' && <ModalEscolherSantuario estado={estado} />}
    </div>
  );
}
