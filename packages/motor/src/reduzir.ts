// Seção 15.1/15.4 — reducer puro, e Seção 16.2/16.3/16.4 — Chronos, pipeline
// de fim de turno e encerramento.
//
// `reduzir` é uma função pura: sem Math.random, sem Date.now, sem I/O. Toda
// aleatoriedade entra pelo `seed` da partida (ver aleatorio.ts e criarPartida).
// `atualizadoEm` e `prazoDoTurno` (marcas de tempo reais) são responsabilidade
// da camada de servidor, fora deste pacote — o motor só os inicializa em 0/null.

import { embaralhar, prng } from './aleatorio.js';
import {
  ARGO_LIMIAR,
  CARTAS_VISIVEIS,
  CONFIG_PARTIDA,
  ICOR_TOTAL,
  KLEOS_ARGONAUTAS,
  KLEOS_KERAUNOS,
  KLEOS_SANTUARIO,
  LIMITE_FICHAS,
} from './dados/config.js';
import { SANTUARIOS, SANTUARIO_POR_ID } from './dados/santuarios.js';
import { LENDAS, LENDA_POR_ID } from './dados/lendas.js';
import type { Acao, Bolsa, EstadoJogo, EventoJogo, Essencia, Jogador, Lenda } from './tipos.js';
import { ESSENCIAS } from './tipos.js';
import {
  atualizarJogador,
  bolsaVazia,
  custoVazio,
  jogadorAtual,
  jogadorPorId,
  somaBolsa,
  somarBolsaEm,
  subtrairBolsa,
} from './util.js';
import {
  calcularPagamento,
  podeColherDiferentes,
  podeColherIguais,
  podeDevolver,
  podeEscolherSantuario,
  podePassar,
  podeReivindicar,
  podeReservar,
} from './validar.js';

export type ResultadoAcao =
  | { ok: true; valor: EstadoJogo }
  | { ok: false; motivo: string };

// ─────────────────────────── Setup (Seção 4) ───────────────────────────

export interface JogadorConfig {
  id: string;
  nome: string;
  avatar: string;
}

export interface ConfigPartida {
  partidaId: string;
  seed: string;
  jogadores: JogadorConfig[]; // 2 a 4, na ordem em que entraram na sala
}

/** Sorteio dos Santuários (Seção 16.5): escolhe N cartões e, para cada um, uma face. */
function sortearSantuarios(nJogadores: 2 | 3 | 4, rnd: () => number): string[] {
  const cartoes = embaralhar([1, 2, 3, 4, 5, 6], rnd).slice(0, CONFIG_PARTIDA[nJogadores].santuarios);
  return cartoes.map((c) => {
    const faces = SANTUARIOS.filter((s) => s.cartao === c);
    return faces[Math.floor(rnd() * faces.length)]!.id;
  });
}

export function criarPartida(config: ConfigPartida): EstadoJogo {
  const n = config.jogadores.length;
  if (n < 2 || n > 4) {
    throw new Error('OLYMPOS é para 2 a 4 jogadores');
  }
  const cfg = CONFIG_PARTIDA[n as 2 | 3 | 4];
  const rnd = prng(config.seed);

  const reservatorio: Bolsa = {
    eter: cfg.fichasPorEssencia,
    oceano: cfg.fichasPorEssencia,
    terra: cfg.fichasPorEssencia,
    chama: cfg.fichasPorEssencia,
    sombra: cfg.fichasPorEssencia,
    icor: ICOR_TOTAL,
    chronos: cfg.chronos,
  };

  const baralhosEmbaralhados = {
    1: embaralhar(
      LENDAS.filter((l) => l.nivel === 1).map((l) => l.id),
      rnd,
    ),
    2: embaralhar(
      LENDAS.filter((l) => l.nivel === 2).map((l) => l.id),
      rnd,
    ),
    3: embaralhar(
      LENDAS.filter((l) => l.nivel === 3).map((l) => l.id),
      rnd,
    ),
  };

  const fileiras = {
    1: baralhosEmbaralhados[1].slice(0, CARTAS_VISIVEIS),
    2: baralhosEmbaralhados[2].slice(0, CARTAS_VISIVEIS),
    3: baralhosEmbaralhados[3].slice(0, CARTAS_VISIVEIS),
  };

  const baralhos = {
    1: baralhosEmbaralhados[1].slice(CARTAS_VISIVEIS),
    2: baralhosEmbaralhados[2].slice(CARTAS_VISIVEIS),
    3: baralhosEmbaralhados[3].slice(CARTAS_VISIVEIS),
  };

  const santuariosDisponiveis = sortearSantuarios(n as 2 | 3 | 4, rnd);

  // Determina o jogador inicial aleatoriamente; a ordem resultante fica fixa
  // e vira o sentido horário da mesa pelo resto da partida (Seção 4).
  const ordemInicial = embaralhar(config.jogadores, rnd);

  const jogadores: Jogador[] = ordemInicial.map((j, idx) => ({
    id: j.id,
    nome: j.nome,
    avatar: j.avatar,
    ordem: idx,
    fichas: bolsaVazia(),
    lendas: [],
    dominios: custoVazio(),
    pressagios: [],
    santuarios: [],
    simbolosArgo: 0,
    temChronos: false,
    kleos: 0,
    conectado: true,
    turnosAusente: 0,
  }));

  return {
    partidaId: config.partidaId,
    seed: config.seed,
    fase: 'EM_ANDAMENTO',
    subFase: 'ESCOLHENDO_ACAO',
    jogadores,
    jogadorAtual: 0,
    numeroDoTurno: 0,
    reservatorio,
    baralhos,
    fileiras,
    santuariosDisponiveis,
    argonautas: { dono: null },
    disparouUltimaRodada: null,
    vencedores: [],
    descartePendente: null,
    escolhaSantuarioPendente: null,
    historico: [],
    atualizadoEm: 0,
    prazoDoTurno: null,
  };
}

// ─────────────────────────── Reducer principal ───────────────────────────

export function reduzir(estado: EstadoJogo, acao: Acao): ResultadoAcao {
  switch (acao.tipo) {
    case 'COLHER_DIFERENTES':
      return resolverColherDiferentes(estado, acao.jogadorId, acao.essencias);
    case 'COLHER_IGUAIS':
      return resolverColherIguais(estado, acao.jogadorId, acao.essencia);
    case 'REIVINDICAR':
      return resolverReivindicar(estado, acao.jogadorId, acao.cartaId, acao.origem);
    case 'RESERVAR':
      return resolverReservar(estado, acao.jogadorId, acao.alvo);
    case 'DEVOLVER_FICHAS':
      return resolverDevolverFichas(estado, acao.jogadorId, acao.fichas);
    case 'ESCOLHER_SANTUARIO':
      return resolverEscolherSantuario(estado, acao.jogadorId, acao.santuarioId);
    case 'PASSAR':
      return resolverPassar(estado, acao.jogadorId);
  }
}

function registrar(e: EstadoJogo, evento: EventoJogo): EstadoJogo {
  return { ...e, historico: [...e.historico, evento] };
}

// ─── Kléos derivado (Seção 12.5) ───
// Fresco a cada chamada: Σ kleos(lendas) + 3 × santuarios.length + (dono
// d'Os Argonautas ? 3 : 0). O campo `jogador.kleos` é só um cache deste
// cálculo — mantido em sincronia por `recalcularKleos` sempre que lendas,
// santuários ou o dono d'Os Argonautas mudam.
function kleosDe(e: EstadoJogo, j: Jogador): number {
  const kleosLendas = j.lendas.reduce((acc, id) => acc + (LENDA_POR_ID[id]?.kleos ?? 0), 0);
  return kleosLendas + KLEOS_SANTUARIO * j.santuarios.length + (e.argonautas.dono === j.id ? KLEOS_ARGONAUTAS : 0);
}

function recalcularKleos(e: EstadoJogo, jogadorId: string): EstadoJogo {
  return atualizarJogador(e, jogadorId, (j) => ({ ...j, kleos: kleosDe(e, j) }));
}

export function cumpreKeraunos(e: EstadoJogo, j: Jogador): boolean {
  return (
    kleosDe(e, j) >= KLEOS_KERAUNOS &&
    ESSENCIAS.every((x) => j.dominios[x] >= 1) &&
    j.temChronos
  );
}

// ─── Ação A — Colher 3 diferentes ───

function resolverColherDiferentes(e: EstadoJogo, jogadorId: string, essencias: Essencia[]): ResultadoAcao {
  const v = podeColherDiferentes(e, jogadorId, essencias);
  if (!v.ok) return v;

  const fichasGanhas: Partial<Bolsa> = {};
  let reservatorio = e.reservatorio;
  for (const ess of essencias) {
    reservatorio = { ...reservatorio, [ess]: reservatorio[ess] - 1 };
    fichasGanhas[ess] = (fichasGanhas[ess] ?? 0) + 1;
  }

  let novo = { ...e, reservatorio };
  novo = atualizarJogador(novo, jogadorId, (j) => ({ ...j, fichas: somarBolsaEm(j.fichas, fichasGanhas) }));
  novo = registrar(novo, { t: 'COLHEU', jogadorId, fichas: fichasGanhas });

  return { ok: true, valor: finalizarTurno(novo) };
}

// ─── Ação B — Colher 2 iguais ───

function resolverColherIguais(e: EstadoJogo, jogadorId: string, essencia: Essencia): ResultadoAcao {
  const v = podeColherIguais(e, jogadorId, essencia);
  if (!v.ok) return v;

  let novo: EstadoJogo = {
    ...e,
    reservatorio: { ...e.reservatorio, [essencia]: e.reservatorio[essencia] - 2 },
  };
  novo = atualizarJogador(novo, jogadorId, (j) => ({
    ...j,
    fichas: { ...j.fichas, [essencia]: j.fichas[essencia] + 2 },
  }));
  novo = registrar(novo, { t: 'COLHEU', jogadorId, fichas: { [essencia]: 2 } });

  return { ok: true, valor: finalizarTurno(novo) };
}

// ─── Ganho da Essência de Chronos (Seção 16.2) ───
// Resolvido dentro da Ação C, não no fim do turno.

function aplicarChronos(e: EstadoJogo, jogadorId: string, carta: Lenda): EstadoJogo {
  if (!carta.chronos) return e; // só nível 3
  const j = jogadorPorId(e, jogadorId)!;
  if (j.temChronos) return e; // máx. 1 por jogador, para sempre
  if (e.reservatorio.chronos <= 0) return e; // acabou (não ocorre no jogo base)

  let novo: EstadoJogo = { ...e, reservatorio: { ...e.reservatorio, chronos: e.reservatorio.chronos - 1 } };
  novo = atualizarJogador(novo, jogadorId, (jog) => ({
    ...jog,
    fichas: { ...jog.fichas, chronos: 1 },
    temChronos: true,
  }));
  return registrar(novo, { t: 'GANHOU_CHRONOS', jogadorId, cartaId: carta.id });
}

// ─── Ação C — Reivindicar uma Lenda ───

function resolverReivindicar(
  e: EstadoJogo,
  jogadorId: string,
  cartaId: string,
  origem: 'fileira' | 'pressagio',
): ResultadoAcao {
  const v = podeReivindicar(e, jogadorId, cartaId, origem);
  if (!v.ok) return v;

  const j = jogadorPorId(e, jogadorId)!;
  const carta = LENDA_POR_ID[cartaId]!;
  const { pagamento } = calcularPagamento(j, carta);

  // Efeitos imediatos (Seção 7.3): 1. Domínio, 2. Kléos, 3. símbolos do Argo.
  let novo = atualizarJogador(e, jogadorId, (jog) => ({
    ...jog,
    fichas: subtrairBolsa(jog.fichas, pagamento),
    lendas: [...jog.lendas, carta.id],
    dominios: { ...jog.dominios, [carta.dominio]: jog.dominios[carta.dominio] + 1 },
    simbolosArgo: jog.simbolosArgo + carta.argo,
  }));
  novo = { ...novo, reservatorio: somarBolsaEm(novo.reservatorio, pagamento) };
  novo = recalcularKleos(novo, jogadorId);

  let reposta: string | null = null;

  if (origem === 'fileira') {
    const nivel = carta.nivel;
    const idx = novo.fileiras[nivel].indexOf(carta.id);
    const baralho = novo.baralhos[nivel];
    const novaCartaId = baralho.length > 0 ? (baralho[0] ?? null) : null;
    const novoBaralho = baralho.length > 0 ? baralho.slice(1) : baralho;
    const novaFileira = [...novo.fileiras[nivel]];
    novaFileira[idx] = novaCartaId;
    reposta = novaCartaId;
    novo = {
      ...novo,
      baralhos: { ...novo.baralhos, [nivel]: novoBaralho },
      fileiras: { ...novo.fileiras, [nivel]: novaFileira },
    };
  } else {
    novo = atualizarJogador(novo, jogadorId, (jog) => ({
      ...jog,
      pressagios: jog.pressagios.filter((p) => p.cartaId !== carta.id),
    }));
  }

  novo = registrar(novo, {
    t: 'REIVINDICOU',
    jogadorId,
    cartaId: carta.id,
    pagamento,
    origem,
    reposta,
  });

  // 4. Se a carta for de nível 3 e o jogador ainda não tiver Chronos, ganha agora.
  novo = aplicarChronos(novo, jogadorId, carta);

  return { ok: true, valor: finalizarTurno(novo) };
}

// ─── Ação D — Reservar um Presságio ───

function resolverReservar(
  e: EstadoJogo,
  jogadorId: string,
  alvo: Extract<Acao, { tipo: 'RESERVAR' }>['alvo'],
): ResultadoAcao {
  const v = podeReservar(e, jogadorId, alvo);
  if (!v.ok) return v;

  let novo = e;
  let cartaId: string;
  let nivel: 1 | 2 | 3;
  let oculto: boolean;
  let reposta: string | null = null;

  if (alvo.tipo === 'fileira') {
    cartaId = alvo.cartaId;
    const carta = LENDA_POR_ID[cartaId]!;
    nivel = carta.nivel;
    oculto = false;

    const idx = novo.fileiras[nivel].indexOf(cartaId);
    const baralho = novo.baralhos[nivel];
    const novaCartaId = baralho.length > 0 ? (baralho[0] ?? null) : null;
    const novoBaralho = baralho.length > 0 ? baralho.slice(1) : baralho;
    const novaFileira = [...novo.fileiras[nivel]];
    novaFileira[idx] = novaCartaId;
    reposta = novaCartaId;

    novo = {
      ...novo,
      baralhos: { ...novo.baralhos, [nivel]: novoBaralho },
      fileiras: { ...novo.fileiras, [nivel]: novaFileira },
    };
  } else {
    nivel = alvo.nivel;
    const baralho = novo.baralhos[nivel];
    cartaId = baralho[0]!;
    oculto = true;
    novo = { ...novo, baralhos: { ...novo.baralhos, [nivel]: baralho.slice(1) } };
  }

  const ganhouIcor = novo.reservatorio.icor > 0;
  novo = atualizarJogador(novo, jogadorId, (j) => ({
    ...j,
    pressagios: [...j.pressagios, { cartaId, oculto, nivel }],
    fichas: ganhouIcor ? { ...j.fichas, icor: j.fichas.icor + 1 } : j.fichas,
  }));
  if (ganhouIcor) {
    novo = { ...novo, reservatorio: { ...novo.reservatorio, icor: novo.reservatorio.icor - 1 } };
  }

  novo = registrar(novo, {
    t: 'RESERVOU',
    jogadorId,
    cartaId: oculto ? null : cartaId,
    nivel,
    oculto,
    ganhouIcor,
    reposta,
  });

  return { ok: true, valor: finalizarTurno(novo) };
}

// ─── Sub-ação: devolver fichas (subFase DESCARTANDO) ───

function resolverDevolverFichas(e: EstadoJogo, jogadorId: string, fichas: Partial<Bolsa>): ResultadoAcao {
  const v = podeDevolver(e, jogadorId, fichas);
  if (!v.ok) return v;

  let novo = atualizarJogador(e, jogadorId, (j) => ({ ...j, fichas: subtrairBolsa(j.fichas, fichas) }));
  novo = { ...novo, reservatorio: somarBolsaEm(novo.reservatorio, fichas) };
  novo = registrar(novo, { t: 'DEVOLVEU', jogadorId, fichas });

  return { ok: true, valor: finalizarTurno(novo, 'descarte') };
}

// ─── Os Argonautas (Seção 11) ───
// Verificado ao final de cada turno, após o descarte e antes da verificação
// de Santuários. A carta é volátil: o dono muda sempre que outro jogador
// SUPERA (não apenas iguala) os símbolos do dono atual.

function verificarArgonautas(e: EstadoJogo, jogadorId: string): EstadoJogo {
  const j = jogadorPorId(e, jogadorId)!;
  const donoAtualId = e.argonautas.dono;
  const simbolosDono = donoAtualId !== null ? jogadorPorId(e, donoAtualId)!.simbolosArgo : -1;

  if (j.simbolosArgo < ARGO_LIMIAR) return e; // limiar mínimo
  if (donoAtualId === j.id) return e; // já é dele
  if (donoAtualId !== null && j.simbolosArgo <= simbolosDono) return e; // empate mantém

  let novo: EstadoJogo = { ...e, argonautas: { dono: j.id } };
  novo = recalcularKleos(novo, j.id);
  if (donoAtualId !== null) novo = recalcularKleos(novo, donoAtualId);

  return registrar(novo, { t: 'ARGONAUTAS', de: donoAtualId, para: j.id, simbolos: j.simbolosArgo });
}

// ─── Sub-ação: escolher Santuário (subFase ESCOLHENDO_SANTUARIO) ───

function concederSantuario(e: EstadoJogo, jogadorId: string, santuarioId: string): EstadoJogo {
  let novo: EstadoJogo = { ...e, santuariosDisponiveis: e.santuariosDisponiveis.filter((id) => id !== santuarioId) };
  novo = atualizarJogador(novo, jogadorId, (j) => ({ ...j, santuarios: [...j.santuarios, santuarioId] }));
  novo = recalcularKleos(novo, jogadorId);
  return registrar(novo, { t: 'SANTUARIO', jogadorId, santuarioId });
}

function resolverEscolherSantuario(e: EstadoJogo, jogadorId: string, santuarioId: string): ResultadoAcao {
  const v = podeEscolherSantuario(e, jogadorId, santuarioId);
  if (!v.ok) return v;

  const novo = concederSantuario({ ...e, escolhaSantuarioPendente: null }, jogadorId, santuarioId);
  return { ok: true, valor: finalizarTurno(novo, 'santuario') };
}

// ─── Turno sem ação legal (Seção 7.5) ───

function resolverPassar(e: EstadoJogo, jogadorId: string): ResultadoAcao {
  const v = podePassar(e, jogadorId);
  if (!v.ok) return v;

  const novo = registrar(e, { t: 'PASSOU', jogadorId, motivo: 'Nenhuma ação legal disponível' });
  return { ok: true, valor: finalizarTurno(novo) };
}

// ─────────────────────── Pipeline de fim de turno (Seção 16.3) ───────────────────────

type EtapaRetomada = 'descarte' | 'santuario';

function finalizarTurno(estadoInicial: EstadoJogo, apartirDe: EtapaRetomada = 'descarte'): EstadoJogo {
  let e = estadoInicial;
  // `jogadorAtual` só muda no passo 5, então o jogador do turno é o mesmo em
  // qualquer ponto de retomada (descarte/santuario).
  const idJogadorDoTurno = jogadorAtual(e).id;

  // 1. limite de 10 fichas
  if (apartirDe === 'descarte') {
    const j = jogadorPorId(e, idJogadorDoTurno)!;
    const total = somaBolsa(j.fichas);
    if (total > LIMITE_FICHAS) {
      return {
        ...e,
        subFase: 'DESCARTANDO',
        descartePendente: { jogadorId: j.id, excedente: total - LIMITE_FICHAS },
      };
    }
  }

  // 2. Os Argonautas (pode mudar o kleos de DOIS jogadores)
  if (apartirDe !== 'santuario') {
    e = verificarArgonautas(e, idJogadorDoTurno);
  }

  // 3. Santuário (máx. 1 por turno)
  if (apartirDe !== 'santuario') {
    const j = jogadorPorId(e, idJogadorDoTurno)!;
    const elegiveis = e.santuariosDisponiveis.filter((id) =>
      ESSENCIAS.every((x) => j.dominios[x] >= SANTUARIO_POR_ID[id]!.requisito[x]),
    );

    if (elegiveis.length > 1) {
      return {
        ...e,
        subFase: 'ESCOLHENDO_SANTUARIO',
        escolhaSantuarioPendente: { jogadorId: j.id, opcoes: elegiveis },
      };
    }
    if (elegiveis.length === 1) e = concederSantuario(e, j.id, elegiveis[0]!);
  }

  // 4. gatilho do Keraunos
  const jParaGatilho = jogadorPorId(e, idJogadorDoTurno)!;
  if (e.fase === 'EM_ANDAMENTO' && cumpreKeraunos(e, jParaGatilho)) {
    e = { ...e, fase: 'ULTIMA_RODADA', disparouUltimaRodada: jParaGatilho.id };
    e = registrar(e, { t: 'ULTIMA_RODADA', jogadorId: jParaGatilho.id });
  }

  // 5. avançar / encerrar
  const ehUltimoDaOrdem = e.jogadorAtual === e.jogadores.length - 1;

  if (ehUltimoDaOrdem && e.fase === 'ULTIMA_RODADA') {
    const qualificados = e.jogadores.filter((p) => cumpreKeraunos(e, p));
    if (qualificados.length > 0) return encerrarPartida(e, qualificados);

    // Regra especial (Seção 12.4): o gatilho se desfez. O jogo continua.
    e = { ...e, fase: 'EM_ANDAMENTO', disparouUltimaRodada: null };
    e = registrar(e, { t: 'GATILHO_DESFEITO' });
  }

  return {
    ...e,
    jogadorAtual: (e.jogadorAtual + 1) % e.jogadores.length,
    numeroDoTurno: e.numeroDoTurno + 1,
    subFase: 'ESCOLHENDO_ACAO',
    descartePendente: null,
    escolhaSantuarioPendente: null,
    // Marcação de tempo real (prazo do próximo turno) é responsabilidade da
    // camada de servidor — o motor puro não chama Date.now().
    prazoDoTurno: null,
  };
}

// ─────────────────────────── Encerramento (Seção 16.4) ───────────────────────────

function ordemArgonautas(e: EstadoJogo, a: Jogador, b: Jogador): number {
  const ta = e.argonautas.dono === a.id ? 1 : 0;
  const tb = e.argonautas.dono === b.id ? 1 : 0;
  return tb - ta; // quem tem a carta vem primeiro
}

export function encerrarPartida(e: EstadoJogo, qualificados: Jogador[]): EstadoJogo {
  const ranking = [...qualificados].sort(
    (a, b) =>
      b.kleos - a.kleos || // 1º: mais Kléos
      ordemArgonautas(e, a, b) || // 2º: quem tem Os Argonautas
      a.lendas.length - b.lendas.length, // 3º: menos Lendas
  );

  const topo = ranking[0]!;
  const vencedores = ranking
    .filter(
      (p) =>
        p.kleos === topo.kleos &&
        (e.argonautas.dono === p.id) === (e.argonautas.dono === topo.id) &&
        p.lendas.length === topo.lendas.length,
    )
    .map((p) => p.id); // pode haver mais de um

  return registrar({ ...e, fase: 'ENCERRADO', vencedores, prazoDoTurno: null }, { t: 'FIM', vencedores });
}
