// Seção 15.5 — as 14 invariantes que devem valer após todo `reduzir()`.
// Rode `verificarInvariantes` em todo teste e, em desenvolvimento, após toda ação.

import { ARGO_LIMIAR, CONFIG_PARTIDA, ICOR_TOTAL, LIMITE_FICHAS } from './dados/config.js';
import { LENDAS, LENDA_POR_ID } from './dados/lendas.js';
import { SANTUARIOS } from './dados/santuarios.js';
import type { EstadoJogo } from './tipos.js';
import { ESSENCIAS } from './tipos.js';
import { NIVEIS, jogadorPorId, somaBolsa } from './util.js';

export interface ViolacaoInvariante {
  invariante: number;
  descricao: string;
}

/**
 * Verifica as 14 invariantes da Seção 15.5. Retorna a lista de violações
 * encontradas (vazia se o estado é consistente).
 */
export function verificarInvariantes(e: EstadoJogo): ViolacaoInvariante[] {
  const violacoes: ViolacaoInvariante[] = [];
  const n = e.jogadores.length;
  const configValida = n >= 2 && n <= 4;
  const cfg = configValida ? CONFIG_PARTIDA[n as 2 | 3 | 4] : null;

  // 1. Conservação total de fichas, por tipo (inclui ícor e Chronos).
  if (cfg) {
    for (const ess of ESSENCIAS) {
      const total = e.reservatorio[ess] + e.jogadores.reduce((acc, j) => acc + j.fichas[ess], 0);
      if (total !== cfg.fichasPorEssencia) {
        violacoes.push({
          invariante: 1,
          descricao: `Conservação de fichas violada para '${ess}': total ${total}, esperado ${cfg.fichasPorEssencia}`,
        });
      }
    }
    const totalIcor = e.reservatorio.icor + e.jogadores.reduce((acc, j) => acc + j.fichas.icor, 0);
    if (totalIcor !== ICOR_TOTAL) {
      violacoes.push({
        invariante: 1,
        descricao: `Conservação de Ícor violada: total ${totalIcor}, esperado ${ICOR_TOTAL}`,
      });
    }
    const totalChronos = e.reservatorio.chronos + e.jogadores.reduce((acc, j) => acc + j.fichas.chronos, 0);
    if (totalChronos !== cfg.chronos) {
      violacoes.push({
        invariante: 1,
        descricao: `Conservação de Chronos violada: total ${totalChronos}, esperado ${cfg.chronos}`,
      });
    }
  }

  // 2. jogador.dominios[e] == nº de lendas do jogador com dominio === e.
  for (const j of e.jogadores) {
    const contagem: Record<string, number> = Object.fromEntries(ESSENCIAS.map((x) => [x, 0]));
    for (const lendaId of j.lendas) {
      const carta = LENDA_POR_ID[lendaId];
      if (carta) contagem[carta.dominio] = (contagem[carta.dominio] ?? 0) + 1;
    }
    for (const ess of ESSENCIAS) {
      if (j.dominios[ess] !== contagem[ess]) {
        violacoes.push({
          invariante: 2,
          descricao: `Jogador ${j.id}: dominios.${ess} = ${j.dominios[ess]}, esperado ${contagem[ess]}`,
        });
      }
    }
  }

  // 3. jogador.simbolosArgo == Σ argo das lendas do jogador.
  for (const j of e.jogadores) {
    const esperado = j.lendas.reduce((acc, id) => acc + (LENDA_POR_ID[id]?.argo ?? 0), 0);
    if (j.simbolosArgo !== esperado) {
      violacoes.push({
        invariante: 3,
        descricao: `Jogador ${j.id}: simbolosArgo = ${j.simbolosArgo}, esperado ${esperado}`,
      });
    }
  }

  // 4. jogador.kleos == Σ kleos(lendas) + 3 × santuarios.length + (dono d'Os Argonautas ? 3 : 0).
  for (const j of e.jogadores) {
    const kleosLendas = j.lendas.reduce((acc, id) => acc + (LENDA_POR_ID[id]?.kleos ?? 0), 0);
    const esperado = kleosLendas + 3 * j.santuarios.length + (e.argonautas.dono === j.id ? 3 : 0);
    if (j.kleos !== esperado) {
      violacoes.push({
        invariante: 4,
        descricao: `Jogador ${j.id}: kleos = ${j.kleos}, esperado ${esperado}`,
      });
    }
  }

  // 5. jogador.temChronos === (jogador.fichas.chronos > 0) e fichas.chronos <= 1.
  for (const j of e.jogadores) {
    if (j.temChronos !== (j.fichas.chronos > 0)) {
      violacoes.push({
        invariante: 5,
        descricao: `Jogador ${j.id}: temChronos = ${j.temChronos}, mas fichas.chronos = ${j.fichas.chronos}`,
      });
    }
    if (j.fichas.chronos > 1) {
      violacoes.push({
        invariante: 5,
        descricao: `Jogador ${j.id}: fichas.chronos = ${j.fichas.chronos}, máximo é 1`,
      });
    }
  }

  // 6. jogador.fichas.chronos > 0 ⇒ o jogador tem ao menos 1 Lenda de nível 3.
  for (const j of e.jogadores) {
    if (j.fichas.chronos > 0) {
      const temNivel3 = j.lendas.some((id) => LENDA_POR_ID[id]?.nivel === 3);
      if (!temNivel3) {
        violacoes.push({
          invariante: 6,
          descricao: `Jogador ${j.id}: tem Chronos mas nenhuma Lenda de nível 3`,
        });
      }
    }
  }

  // 7. jogador.pressagios.length <= 3.
  for (const j of e.jogadores) {
    if (j.pressagios.length > 3) {
      violacoes.push({
        invariante: 7,
        descricao: `Jogador ${j.id}: ${j.pressagios.length} presságios (máximo 3)`,
      });
    }
  }

  // 8. Σ fichas(jogador) <= 10 sempre que subFase !== 'DESCARTANDO'.
  if (e.subFase !== 'DESCARTANDO') {
    for (const j of e.jogadores) {
      const total = somaBolsa(j.fichas);
      if (total > LIMITE_FICHAS) {
        violacoes.push({
          invariante: 8,
          descricao: `Jogador ${j.id}: ${total} fichas fora de DESCARTANDO (limite ${LIMITE_FICHAS})`,
        });
      }
    }
  }

  // 9. fileiras[n].length === 4 sempre.
  for (const nivel of NIVEIS) {
    if (e.fileiras[nivel].length !== 4) {
      violacoes.push({
        invariante: 9,
        descricao: `fileiras[${nivel}].length = ${e.fileiras[nivel].length}, esperado 4`,
      });
    }
  }

  // 10. Nenhum cartaId aparece em mais de um lugar.
  const ocorrencias = new Map<string, string[]>();
  const registrarOcorrencia = (cartaId: string, local: string) => {
    const lista = ocorrencias.get(cartaId) ?? [];
    lista.push(local);
    ocorrencias.set(cartaId, lista);
  };
  for (const nivel of NIVEIS) {
    for (const id of e.baralhos[nivel]) registrarOcorrencia(id, `baralho[${nivel}]`);
    for (const id of e.fileiras[nivel]) if (id !== null) registrarOcorrencia(id, `fileira[${nivel}]`);
  }
  for (const j of e.jogadores) {
    for (const id of j.lendas) registrarOcorrencia(id, `lendas(${j.id})`);
    for (const p of j.pressagios) registrarOcorrencia(p.cartaId, `pressagios(${j.id})`);
  }
  for (const [cartaId, locais] of ocorrencias) {
    if (locais.length > 1) {
      violacoes.push({
        invariante: 10,
        descricao: `Carta ${cartaId} aparece em múltiplos lugares: ${locais.join(', ')}`,
      });
    }
  }

  // 11. argonautas.dono !== null ⇒ esse jogador tem simbolosArgo >= ARGO_LIMIAR
  //     e é quem tem mais símbolos (ou empatado no topo).
  if (e.argonautas.dono !== null) {
    const dono = jogadorPorId(e, e.argonautas.dono);
    if (!dono) {
      violacoes.push({ invariante: 11, descricao: `Dono d'Os Argonautas ${e.argonautas.dono} não existe` });
    } else {
      if (dono.simbolosArgo < ARGO_LIMIAR) {
        violacoes.push({
          invariante: 11,
          descricao: `Dono d'Os Argonautas ${dono.id} tem ${dono.simbolosArgo} símbolos, mínimo é ${ARGO_LIMIAR}`,
        });
      }
      const maxSimbolos = Math.max(...e.jogadores.map((j) => j.simbolosArgo));
      if (dono.simbolosArgo < maxSimbolos) {
        violacoes.push({
          invariante: 11,
          descricao: `Dono d'Os Argonautas ${dono.id} tem ${dono.simbolosArgo} símbolos, mas o máximo na mesa é ${maxSimbolos}`,
        });
      }
    }
  }

  // 12. santuariosDisponiveis + santuários recebidos por todos = conjunto sorteado no setup.
  const santuariosRecebidos = e.jogadores.flatMap((j) => j.santuarios);
  const conjuntoSantuarios = new Set([...e.santuariosDisponiveis, ...santuariosRecebidos]);
  if (conjuntoSantuarios.size !== e.santuariosDisponiveis.length + santuariosRecebidos.length) {
    violacoes.push({
      invariante: 12,
      descricao: 'Uma face de Santuário aparece tanto em santuariosDisponiveis quanto já recebida por algum jogador',
    });
  }
  for (const id of conjuntoSantuarios) {
    if (!SANTUARIOS.some((s) => s.id === id)) {
      violacoes.push({ invariante: 12, descricao: `Face de Santuário desconhecida: ${id}` });
    }
  }
  if (cfg && conjuntoSantuarios.size !== cfg.santuarios) {
    violacoes.push({
      invariante: 12,
      descricao: `Total de Santuários em jogo = ${conjuntoSantuarios.size}, esperado ${cfg.santuarios} para ${n} jogadores`,
    });
  }

  // 13. Nenhuma face de Santuário em jogo compartilha `cartao` com outra.
  const cartoesVistos = new Map<number, string>();
  for (const id of conjuntoSantuarios) {
    const face = SANTUARIOS.find((s) => s.id === id);
    if (!face) continue;
    const outroId = cartoesVistos.get(face.cartao);
    if (outroId && outroId !== id) {
      violacoes.push({
        invariante: 13,
        descricao: `Cartão ${face.cartao} entra em jogo por mais de uma face: ${outroId} e ${id}`,
      });
    } else {
      cartoesVistos.set(face.cartao, id);
    }
  }

  // 14. Nenhuma carta com chronos: true tem nivel !== 3, e vice-versa.
  for (const l of LENDAS) {
    if (l.chronos !== (l.nivel === 3)) {
      violacoes.push({
        invariante: 14,
        descricao: `Carta ${l.id}: nivel ${l.nivel}, chronos ${l.chronos} — Marca de Chronos deve valer exatamente para nível 3`,
      });
    }
  }

  return violacoes;
}
