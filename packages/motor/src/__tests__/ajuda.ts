// Helpers compartilhados pela suíte de testes (Seção 20 da spec).

import { FICHAS_NAO_DEVOLVIVEIS } from '../dados/config.js';
import { LENDA_POR_ID } from '../dados/lendas.js';
import type { ConfigPartida, JogadorConfig } from '../reduzir.js';
import { criarPartida } from '../reduzir.js';
import type { Acao, Bolsa, EstadoJogo, Ficha } from '../tipos.js';
import { ESSENCIAS, FICHAS } from '../tipos.js';
import { NIVEIS } from '../util.js';
import { calcularPagamento } from '../validar.js';

export function jogadoresPadrao(n: number): JogadorConfig[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `j${i + 1}`,
    nome: `Jogador ${i + 1}`,
    avatar: `avatar-${i + 1}`,
  }));
}

export function novaPartida(
  seed: string,
  numJogadores = 4,
  overrides: Partial<ConfigPartida> = {},
): EstadoJogo {
  return criarPartida({
    partidaId: 'PARTIDA-TESTE',
    seed,
    jogadores: jogadoresPadrao(numJogadores),
    ...overrides,
  });
}

export function esperarOk(resultado: { ok: boolean; motivo?: string }): void {
  if (!resultado.ok) {
    throw new Error(`Esperava ok, recebeu erro: ${resultado.motivo}`);
  }
}

function escolherFichasParaDevolver(fichas: Bolsa, excedente: number, rnd: () => number): Partial<Bolsa> {
  const pool: Ficha[] = [];
  // A Essência de Chronos nunca pode ser devolvida (Seção 8).
  for (const f of FICHAS) {
    if (FICHAS_NAO_DEVOLVIVEIS.includes(f)) continue;
    for (let i = 0; i < fichas[f]; i++) pool.push(f);
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  const resultado: Partial<Bolsa> = {};
  for (const f of pool.slice(0, excedente)) resultado[f] = (resultado[f] ?? 0) + 1;
  return resultado;
}

/**
 * Gera uma ação legal aleatória para o estado atual, usada pelo fuzz test
 * (Seção 20: "500 turnos com ações legais aleatórias"). Determinística: toda
 * a aleatoriedade vem de `rnd`, nunca de Math.random.
 */
export function acaoAleatoriaLegal(e: EstadoJogo, rnd: () => number): Acao {
  if (e.subFase === 'DESCARTANDO') {
    const pendente = e.descartePendente!;
    const jogador = e.jogadores.find((j) => j.id === pendente.jogadorId)!;
    const fichas = escolherFichasParaDevolver(jogador.fichas, pendente.excedente, rnd);
    return { tipo: 'DEVOLVER_FICHAS', jogadorId: pendente.jogadorId, fichas };
  }

  if (e.subFase === 'ESCOLHENDO_SANTUARIO') {
    const pendente = e.escolhaSantuarioPendente!;
    const idx = Math.floor(rnd() * pendente.opcoes.length);
    return { tipo: 'ESCOLHER_SANTUARIO', jogadorId: pendente.jogadorId, santuarioId: pendente.opcoes[idx]! };
  }

  const atual = e.jogadores[e.jogadorAtual]!;
  const candidatos: Acao[] = [];

  const disponiveis = ESSENCIAS.filter((x) => e.reservatorio[x] > 0);
  const maximo = Math.min(3, disponiveis.length);
  if (maximo > 0) {
    candidatos.push({ tipo: 'COLHER_DIFERENTES', jogadorId: atual.id, essencias: disponiveis.slice(0, maximo) });
  }
  for (const ess of ESSENCIAS) {
    if (e.reservatorio[ess] >= 4) {
      candidatos.push({ tipo: 'COLHER_IGUAIS', jogadorId: atual.id, essencia: ess });
    }
  }

  if (atual.pressagios.length < 3) {
    for (const nivel of NIVEIS) {
      for (const cartaId of e.fileiras[nivel]) {
        if (cartaId) candidatos.push({ tipo: 'RESERVAR', jogadorId: atual.id, alvo: { tipo: 'fileira', cartaId } });
      }
      if (e.baralhos[nivel].length > 0) {
        candidatos.push({ tipo: 'RESERVAR', jogadorId: atual.id, alvo: { tipo: 'baralho', nivel } });
      }
    }
  }

  const idsFileira = NIVEIS.flatMap((n) => e.fileiras[n].filter((c): c is string => c !== null));
  const idsPressagio = atual.pressagios.map((p) => p.cartaId);
  for (const cid of [...idsFileira, ...idsPressagio]) {
    const carta = LENDA_POR_ID[cid];
    if (!carta) continue;
    if (calcularPagamento(atual, carta).possivel) {
      const origem: 'fileira' | 'pressagio' = idsFileira.includes(cid) ? 'fileira' : 'pressagio';
      candidatos.push({ tipo: 'REIVINDICAR', jogadorId: atual.id, cartaId: cid, origem });
    }
  }

  if (candidatos.length === 0) {
    return { tipo: 'PASSAR', jogadorId: atual.id };
  }

  return candidatos[Math.floor(rnd() * candidatos.length)]!;
}
