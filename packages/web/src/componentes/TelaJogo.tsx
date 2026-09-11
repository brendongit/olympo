// Layout desktop (Seção 19.3): SANTUÁRIOS+KERAUNOS | FILEIRAS + RESERVATÓRIO
// | ARGONAUTAS+OPONENTES, com o painel do jogador da vez fixo embaixo e a
// barra compacta do Keraunos sempre visível no cabeçalho (Seção 19.5).

import type { EstadoVisivel } from '@olympos/motor';
import { useEhMobile } from '../lib/useMediaQuery.js';
import { AnuncioSuaVez } from './AnuncioSuaVez.js';
import { BannerGatilhoDesfeito } from './BannerGatilhoDesfeito.js';
import { ChronosObtidoOverlay } from './ChronosObtidoOverlay.js';
import { ContadorDeTurno } from './ContadorDeTurno.js';
import { BarraKeraunosCompacta, PainelKeraunos } from './PainelKeraunos.js';
import { FeedDeEventos } from './FeedDeEventos.js';
import { FileirasLendas } from './FileirasLendas.js';
import { IndicadorArgonautas } from './IndicadorArgonautas.js';
import { ModalDescarte } from './ModalDescarte.js';
import { ModalEscolherSantuario } from './ModalEscolherSantuario.js';
import { PainelJogador } from './PainelJogador.js';
import { PainelOponentes } from './PainelOponentes.js';
import { PainelPreferencias } from './PainelPreferencias.js';
import { PainelSantuarios } from './PainelSantuarios.js';
import { PainelVotacaoEncerrar } from './PainelVotacaoEncerrar.js';
import { Reservatorio } from './Reservatorio.js';
import { SantuarioConquistadoOverlay } from './SantuarioConquistadoOverlay.js';
import { TelaFimDeJogo } from './TelaFimDeJogo.js';
import { TelaJogoMobile } from './TelaJogoMobile.js';

export function TelaJogo({
  estadoVisivel,
  jogadorFocoId,
}: {
  estadoVisivel: EstadoVisivel;
  /** Quem tem o painel de ação — default: quem tem a vez (hotseat local). Online: sempre "eu". */
  jogadorFocoId?: string;
}) {
  const ehMobile = useEhMobile();

  if (estadoVisivel.fase === 'ENCERRADO') {
    return <TelaFimDeJogo estadoVisivel={estadoVisivel} />;
  }

  if (ehMobile) {
    return <TelaJogoMobile estadoVisivel={estadoVisivel} jogadorFocoId={jogadorFocoId} />;
  }

  const jogadorDaVez = estadoVisivel.jogadores[estadoVisivel.jogadorAtual]!;

  return (
    <div className="flex h-screen flex-col bg-stone-950 text-stone-100">
      <header className="flex items-center gap-3 border-b border-stone-800 bg-stone-900 px-4 py-2">
        <h1 className="font-serif text-lg font-bold tracking-wide text-amber-200">OLYMPOS</h1>
        <span className="text-xs text-stone-500">partida local</span>
        <span className="text-sm text-stone-300">
          Vez de <span className="font-semibold text-amber-300">{jogadorDaVez.nome}</span>
        </span>
        <div className="ml-auto flex items-center gap-2">
          <PainelVotacaoEncerrar estadoVisivel={estadoVisivel} />
          <ContadorDeTurno estadoVisivel={estadoVisivel} />
          <BarraKeraunosCompacta estadoVisivel={estadoVisivel} jogadorFocoId={jogadorFocoId} />
          <PainelPreferencias />
        </div>
        {estadoVisivel.fase === 'ULTIMA_RODADA' && (
          <span className="rounded bg-red-800 px-2 py-0.5 text-xs font-semibold text-red-100" aria-live="assertive">
            Última rodada —{' '}
            {estadoVisivel.jogadores.find((j) => j.id === estadoVisivel.disparouUltimaRodada)?.nome} forjou o
            Keraunos
          </span>
        )}
      </header>

      <BannerGatilhoDesfeito />

      <div className="grid flex-1 grid-cols-[240px_1fr_260px] overflow-hidden">
        <aside className="flex flex-col gap-3 overflow-y-auto border-r border-stone-800 p-3">
          <PainelKeraunos estadoVisivel={estadoVisivel} jogadorFocoId={jogadorFocoId} />
          <PainelSantuarios estadoVisivel={estadoVisivel} jogadorFocoId={jogadorFocoId} />
        </aside>

        <main className="flex flex-col overflow-hidden p-3">
          <FileirasLendas estadoVisivel={estadoVisivel} jogadorFocoId={jogadorFocoId} />
          <Reservatorio key={estadoVisivel.numeroDoTurno} estadoVisivel={estadoVisivel} jogadorFocoId={jogadorFocoId} />
        </main>

        <aside className="flex flex-col gap-3 overflow-y-auto border-l border-stone-800 p-3">
          <IndicadorArgonautas estadoVisivel={estadoVisivel} />
          <PainelOponentes estadoVisivel={estadoVisivel} jogadorFocoId={jogadorFocoId} />
          <FeedDeEventos />
        </aside>
      </div>

      <PainelJogador estadoVisivel={estadoVisivel} jogadorFocoId={jogadorFocoId} />

      {estadoVisivel.subFase === 'DESCARTANDO' && <ModalDescarte estadoVisivel={estadoVisivel} />}
      {estadoVisivel.subFase === 'ESCOLHENDO_SANTUARIO' && (
        <ModalEscolherSantuario estadoVisivel={estadoVisivel} />
      )}

      <ChronosObtidoOverlay />
      <SantuarioConquistadoOverlay />
      <AnuncioSuaVez />
    </div>
  );
}
