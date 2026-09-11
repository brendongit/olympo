// Seção 16.1 — Funções de validação.
//
// Cada `podeX` retorna { ok: true } | { ok: false; motivo: string }. A UI usa
// exatamente estas funções para desabilitar botões antes do clique — o `motivo`
// precisa ser texto exibível diretamente.

import { LENDA_POR_ID } from './dados/lendas.js';
import { MAX_PRESSAGIOS, MIN_PARA_DUPLA } from './dados/config.js';
import type { Acao, Bolsa, EstadoOuVisivel, Essencia, JogadorOuVisivel, Lenda, Resultado } from './tipos.js';
import { ESSENCIAS, FICHAS } from './tipos.js';
import { NIVEIS, bolsaVazia, cartaEstaVisivel, ehVezDe, jogadorPorId, somaBolsa } from './util.js';

function ok(): Resultado {
  return { ok: true };
}

function erro(motivo: string): Resultado {
  return { ok: false, motivo };
}

export type AlvoReserva = Extract<Acao, { tipo: 'RESERVAR' }>['alvo'];

/** `baralhos[n]` é o array real no servidor, ou só a contagem na projeção do cliente (Seção 18) — normaliza os dois. */
function nCartasNoBaralho(baralho: string[] | number): number {
  return typeof baralho === 'number' ? baralho : baralho.length;
}

// ─── Colher 3 diferentes ───
export function podeColherDiferentes(e: EstadoOuVisivel, jogadorId: string, essencias: Essencia[]): Resultado {
  if (e.fase === 'ENCERRADO') return erro('A partida já terminou');
  if (!ehVezDe(e, jogadorId)) return erro('Não é seu turno');
  if (e.subFase !== 'ESCOLHENDO_ACAO') return erro('Resolva a etapa pendente');
  if (new Set(essencias).size !== essencias.length) return erro('Essências repetidas');
  // Guarda em runtime, não só em tipo: uma ação chega da rede como JSON não
  // tipado, então 'icor'/'chronos' podem aparecer aqui mesmo com `Essencia[]`
  // no tipo (Seção 13, caso 27).
  if (essencias.some((x) => !(ESSENCIAS as readonly string[]).includes(x)))
    return erro('Não é possível colher Ícor nem Chronos com esta ação');

  const disponiveis = ESSENCIAS.filter((x) => e.reservatorio[x] > 0);
  const maximo = Math.min(3, disponiveis.length);

  // Se não há nenhuma essência colorida no reservatório, não existe "colher
  // menos que zero": o jogador precisa usar PASSAR (Seção 7.5), não um colher
  // vazio. Isso mantém a semântica de "turno sem ação legal" bem definida.
  if (maximo === 0) return erro('Nenhuma essência disponível no reservatório');
  if (essencias.length !== maximo) return erro(`Você deve pegar exatamente ${maximo}`);
  if (essencias.some((x) => e.reservatorio[x] <= 0)) return erro('Essência esgotada');

  return ok();
}

// ─── Colher 2 iguais ───
export function podeColherIguais(e: EstadoOuVisivel, jogadorId: string, essencia: Essencia): Resultado {
  if (e.fase === 'ENCERRADO') return erro('A partida já terminou');
  if (!ehVezDe(e, jogadorId)) return erro('Não é seu turno');
  if (e.subFase !== 'ESCOLHENDO_ACAO') return erro('Resolva a etapa pendente');
  if (!(ESSENCIAS as readonly string[]).includes(essencia))
    return erro('Não é possível colher Ícor nem Chronos com esta ação');
  if (e.reservatorio[essencia] < MIN_PARA_DUPLA) return erro('A pilha precisa ter ao menos 4 essências');
  return ok();
}

// ─── Reservar ───
export function podeReservar(e: EstadoOuVisivel, jogadorId: string, alvo: AlvoReserva): Resultado {
  if (e.fase === 'ENCERRADO') return erro('A partida já terminou');
  const j = jogadorPorId(e, jogadorId);
  if (!j) return erro('Jogador inválido');
  if (!ehVezDe(e, jogadorId)) return erro('Não é seu turno');
  if (e.subFase !== 'ESCOLHENDO_ACAO') return erro('Resolva a etapa pendente');
  if (j.pressagios.length >= MAX_PRESSAGIOS) return erro('Você já tem 3 presságios');
  if (alvo.tipo === 'baralho' && nCartasNoBaralho(e.baralhos[alvo.nivel]) === 0) return erro('Baralho vazio');
  if (alvo.tipo === 'fileira' && !cartaEstaVisivel(e, alvo.cartaId)) return erro('Carta indisponível');
  return ok(); // NÃO checar ícor: reservar sem ícor é legal
}

// ─── Reivindicar ───
// Seção 7.3: o desconto do Domínio é aplicado primeiro; a Essência de Chronos
// nunca entra no pagamento (nem é oferecida, nem aparece na tela).
export function calcularPagamento(j: JogadorOuVisivel, carta: Lenda): { possivel: boolean; pagamento: Bolsa } {
  const pagamento: Bolsa = bolsaVazia();
  let icorNecessario = 0;

  for (const ess of ESSENCIAS) {
    const faltante = Math.max(0, carta.custo[ess] - j.dominios[ess]);
    const comFicha = Math.min(j.fichas[ess], faltante);
    pagamento[ess] = comFicha;
    icorNecessario += faltante - comFicha;
  }

  pagamento.icor = icorNecessario;
  return { possivel: icorNecessario <= j.fichas.icor, pagamento };
}

export function podeReivindicar(
  e: EstadoOuVisivel,
  jogadorId: string,
  cartaId: string,
  origem: 'fileira' | 'pressagio',
): Resultado {
  if (e.fase === 'ENCERRADO') return erro('A partida já terminou');
  const j = jogadorPorId(e, jogadorId);
  if (!j) return erro('Jogador inválido');
  if (!ehVezDe(e, jogadorId)) return erro('Não é seu turno');
  if (e.subFase !== 'ESCOLHENDO_ACAO') return erro('Resolva a etapa pendente');

  // A origem declarada pela ação precisa bater com onde a carta realmente
  // está — nunca confie apenas no cartaId (a ação chega da rede como JSON).
  if (origem === 'fileira' && !cartaEstaVisivel(e, cartaId)) return erro('Carta não está em nenhuma fileira');
  if (origem === 'pressagio' && !j.pressagios.some((p) => p.cartaId === cartaId))
    return erro('Carta não é um presságio seu');

  const carta = LENDA_POR_ID[cartaId];
  if (!carta) return erro('Carta inexistente');

  const { possivel } = calcularPagamento(j, carta);
  return possivel ? ok() : erro('Essências insuficientes');
}

// ─── Devolver fichas ───
export function podeDevolver(e: EstadoOuVisivel, jogadorId: string, fichas: Partial<Bolsa>): Resultado {
  if (e.fase === 'ENCERRADO') return erro('A partida já terminou');
  if (e.subFase !== 'DESCARTANDO') return erro('Nada a devolver');
  if (!e.descartePendente || e.descartePendente.jogadorId !== jogadorId)
    return erro('Não é sua vez de devolver fichas');

  const j = jogadorPorId(e, jogadorId);
  if (!j) return erro('Jogador inválido');

  // A Essência de Chronos nunca pode ser devolvida — nem quando é a única
  // ficha devolvível disponível (Seção 8, casos de borda 7 e 8).
  if ((fichas.chronos ?? 0) > 0) return erro('A Essência de Chronos nunca pode ser devolvida');

  const total = somaBolsa(fichas);
  if (total !== e.descartePendente.excedente) return erro(`Devolva exatamente ${e.descartePendente.excedente}`);

  for (const f of FICHAS) {
    if ((fichas[f] ?? 0) > j.fichas[f]) return erro('Você não tem essas fichas');
  }
  return ok();
}

// ─── Escolher Santuário ───
export function podeEscolherSantuario(e: EstadoOuVisivel, jogadorId: string, santuarioId: string): Resultado {
  if (e.fase === 'ENCERRADO') return erro('A partida já terminou');
  if (e.subFase !== 'ESCOLHENDO_SANTUARIO') return erro('Nenhuma escolha de Santuário pendente');
  if (!e.escolhaSantuarioPendente || e.escolhaSantuarioPendente.jogadorId !== jogadorId)
    return erro('Não é sua escolha de Santuário');
  if (!e.escolhaSantuarioPendente.opcoes.includes(santuarioId)) return erro('Santuário não é uma opção válida');
  return ok();
}

// ─── Passar (Seção 7.5) ───
export function existeAcaoLegal(e: EstadoOuVisivel, j: JogadorOuVisivel): boolean {
  // A: colher diferentes — legal assim que houver ao menos 1 tipo de essência
  // colorida disponível (o jogador pega `min(3, disponíveis)`).
  const tiposDisponiveis = ESSENCIAS.filter((x) => e.reservatorio[x] > 0);
  if (tiposDisponiveis.length > 0) return true;

  // B (colher 2 iguais) exige uma pilha >= 4, que já implica tiposDisponiveis
  // não-vazio — coberto pelo ramo acima.

  // D: reservar, mesmo sem ganhar Ícor.
  if (j.pressagios.length < MAX_PRESSAGIOS) {
    const baralhoComCartas = NIVEIS.some((n) => nCartasNoBaralho(e.baralhos[n]) > 0);
    const fileiraComCartas = NIVEIS.some((n) => e.fileiras[n].some((c) => c !== null));
    if (baralhoComCartas || fileiraComCartas) return true;
  }

  // C: reivindicar (fileira ou presságio).
  const idsFileira = NIVEIS.flatMap((n) => e.fileiras[n].filter((c): c is string => c !== null));
  // p.cartaId só é null quando o presságio é oculto e alheio (Seção 18) —
  // não pode acontecer aqui, já que `j` é sempre o próprio jogador sendo
  // validado, mas o filtro mantém o tipo são pra EstadoVisivel também.
  const idsPressagio = j.pressagios.map((p) => p.cartaId).filter((id): id is string => id !== null);
  for (const cid of [...idsFileira, ...idsPressagio]) {
    const carta = LENDA_POR_ID[cid];
    if (!carta) continue;
    if (calcularPagamento(j, carta).possivel) return true;
  }

  return false;
}

export function podePassar(e: EstadoOuVisivel, jogadorId: string): Resultado {
  if (e.fase === 'ENCERRADO') return erro('A partida já terminou');
  const j = jogadorPorId(e, jogadorId);
  if (!j) return erro('Jogador inválido');
  if (!ehVezDe(e, jogadorId)) return erro('Não é seu turno');
  if (e.subFase !== 'ESCOLHENDO_ACAO') return erro('Resolva a etapa pendente');
  if (existeAcaoLegal(e, j)) return erro('Existe uma ação legal disponível');
  return ok();
}

// ─── Encerrar por abandono (Seção 17.6 — votação de encerramento) ───
export function podeEncerrarAbandono(e: EstadoOuVisivel): Resultado {
  if (e.fase === 'ENCERRADO') return erro('A partida já terminou');
  return ok();
}
