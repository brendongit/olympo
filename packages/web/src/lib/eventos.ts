// Seção 17.5 — traduz EventoJogo (dado bruto do motor) pra linguagem
// temática, usado pelo feed (aria-live="polite") e pelos anúncios
// aria-live="assertive". Puramente apresentacional: nenhuma decisão de
// regra acontece aqui, só formatação de texto a partir de dado já
// resolvido pelo motor.

import type { Bolsa, EventoJogo, Ficha, JogadorVisivel } from '@olympos/motor';
import { LENDA_POR_ID, SANTUARIO_POR_ID } from '@olympos/motor';
import { INFO_FICHA } from './tema.js';

function nomeDe(jogadores: readonly JogadorVisivel[], id: string): string {
  return jogadores.find((j) => j.id === id)?.nome ?? 'Alguém';
}

function listarFichas(fichas: Partial<Bolsa>): string {
  const partes = (Object.keys(fichas) as Ficha[])
    .filter((f) => (fichas[f] ?? 0) > 0)
    .map((f) => `${fichas[f]} ${INFO_FICHA[f].rotulo}`);
  return partes.join(', ');
}

export function narrarEvento(evento: EventoJogo, jogadores: readonly JogadorVisivel[]): string {
  switch (evento.t) {
    case 'COLHEU':
      return `${nomeDe(jogadores, evento.jogadorId)} colheu ${listarFichas(evento.fichas)}`;

    case 'REIVINDICOU': {
      const lenda = LENDA_POR_ID[evento.cartaId];
      const detalhe = lenda ? ` (${INFO_FICHA[lenda.dominio].rotulo}, ${lenda.kleos} Kléos)` : '';
      return `${nomeDe(jogadores, evento.jogadorId)} reivindicou ${lenda?.nome ?? 'uma Lenda'}${detalhe}`;
    }

    case 'GANHOU_CHRONOS':
      return `${nomeDe(jogadores, evento.jogadorId)} forjou a Essência de Chronos`;

    case 'RESERVOU':
      return evento.oculto
        ? `${nomeDe(jogadores, evento.jogadorId)} reservou às cegas do topo do baralho (nível ${evento.nivel})`
        : `${nomeDe(jogadores, evento.jogadorId)} reservou ${LENDA_POR_ID[evento.cartaId ?? '']?.nome ?? 'uma Lenda'}`;

    case 'DEVOLVEU':
      return `${nomeDe(jogadores, evento.jogadorId)} devolveu ${listarFichas(evento.fichas)}`;

    case 'ARGONAUTAS': {
      const simbolosPara = jogadores.find((j) => j.id === evento.para)?.simbolosArgo ?? evento.simbolos;
      const simbolosDe = evento.de ? jogadores.find((j) => j.id === evento.de)?.simbolosArgo : null;
      const contraparte = evento.de
        ? ` de ${nomeDe(jogadores, evento.de)} — ${simbolosPara} símbolos contra ${simbolosDe ?? '?'}`
        : ` — ${simbolosPara} símbolos`;
      return `${nomeDe(jogadores, evento.para)} tomou Os Argonautas${contraparte}`;
    }

    case 'SANTUARIO': {
      const santuario = SANTUARIO_POR_ID[evento.santuarioId];
      return santuario
        ? `${santuario.nome} se une a ${nomeDe(jogadores, evento.jogadorId)}`
        : `${nomeDe(jogadores, evento.jogadorId)} conquistou um Santuário`;
    }

    case 'PASSOU':
      return `${nomeDe(jogadores, evento.jogadorId)} passou — ${evento.motivo}`;

    case 'ULTIMA_RODADA':
      return `${nomeDe(jogadores, evento.jogadorId)} forjou o Keraunos — última rodada`;

    case 'GATILHO_DESFEITO':
      return 'O Keraunos se desfez. O jogo continua.';

    case 'FIM':
      return evento.vencedores.length > 1
        ? `Vitória compartilhada: ${evento.vencedores.map((id) => nomeDe(jogadores, id)).join(' e ')}`
        : `${nomeDe(jogadores, evento.vencedores[0] ?? '')} forjou o Keraunos e venceu`;

    case 'ENCERRADA_POR_ABANDONO':
      return 'A sala votou para encerrar a partida';
  }
}
