// Ações automáticas do timer de turno (Seção 17.6). Funções puras: decidem
// QUAL ação submeter quando o tempo esgota, mas quem valida e aplica de
// verdade continua sendo `reduzir`/`aplicarAcao` — isto aqui só escolhe.

import type { Acao, Bolsa, EstadoJogo, Jogador } from '@olympos/motor';
import { ESSENCIAS, FICHAS, FICHAS_NAO_DEVOLVIVEIS } from '@olympos/motor';

/**
 * ESCOLHENDO_ACAO expira: colhe as essências coloridas disponíveis (até 3);
 * se o reservatório estiver sem nenhuma, passa. Nunca reivindica nem
 * reserva automaticamente — mudaria a estratégia do jogador de forma
 * irreversível (Seção 17.6).
 */
export function colheitaAutomatica(estado: EstadoJogo): Acao {
  const jogadorId = estado.jogadores[estado.jogadorAtual]!.id;
  const disponiveis = ESSENCIAS.filter((e) => estado.reservatorio[e] > 0);
  const maximo = Math.min(3, disponiveis.length);

  if (maximo === 0) {
    return { tipo: 'PASSAR', jogadorId };
  }
  return { tipo: 'COLHER_DIFERENTES', jogadorId, essencias: disponiveis.slice(0, maximo) };
}

/**
 * DESCARTANDO expira: devolve as fichas mais abundantes primeiro,
 * evitando Ícor enquanto der. Chronos nunca é candidata (Seção 17.6).
 */
export function devolucaoAutomatica(jogador: Pick<Jogador, 'fichas'>, excedente: number): Partial<Bolsa> {
  const candidatas = FICHAS.filter((f) => !FICHAS_NAO_DEVOLVIVEIS.includes(f));
  const ordenadas = [...candidatas].sort((a, b) => {
    if (a === 'icor' && b !== 'icor') return 1;
    if (b === 'icor' && a !== 'icor') return -1;
    return jogador.fichas[b] - jogador.fichas[a];
  });

  const resultado: Partial<Bolsa> = {};
  let restante = excedente;
  for (const f of ordenadas) {
    if (restante <= 0) break;
    const tirar = Math.min(jogador.fichas[f], restante);
    if (tirar > 0) {
      resultado[f] = tirar;
      restante -= tirar;
    }
  }
  return resultado;
}

/** ESCOLHENDO_SANTUARIO expira: concede o primeiro da lista de opções (Seção 17.6). */
export function santuarioAutomatico(pendente: { opcoes: string[] }): string {
  return pendente.opcoes[0]!;
}
