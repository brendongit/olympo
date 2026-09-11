// Store Zustand: só chama funções do @olympos/motor (reduzir, criarPartida,
// verificarInvariantes, projetarPara) ou emite/ouve eventos do socket
// (Seção 17.3). Nenhuma lógica de regra vive aqui — esta camada só guarda
// `EstadoVisivel` e repassa ações.
//
// Modo LOCAL (hotseat): o cliente É a autoridade — chama `reduzir` direto e
// projeta pra quem tem a vez.
// Modo ONLINE (Fase 4): a autoridade é o servidor. `despachar` só emite
// `jogo:acao`; `estadoVisivel` só muda quando `jogo:estado` chega. Sem
// previsão local via `reduzir` — o cliente não tem a ordem real dos
// baralhos (Seção 18: "Privado"), então não há como prever com segurança o
// resultado de uma ação que revela carta. Em vez disso, o botão clicado
// fica desabilitado ("pendente") até a confirmação ou rejeição do servidor.

import { create } from 'zustand';
import type { Acao, EstadoJogo, EstadoVisivel, EventoJogo } from '@olympos/motor';
import { criarPartida, projetarPara, reduzir, verificarInvariantes } from '@olympos/motor';
import { conectarSocket, desconectarSocket } from '../rede/socket.js';

const TAMANHO_MAX_FEED = 50;
let proximoIdFeed = 0;

const AVATARES = ['🦉', '🔱', '🏹', '🛡️'];
const CHAVE_SESSAO = 'olympos:sessao';

function gerarId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function checarInvariantesEmDev(estado: EstadoJogo, contexto: string): void {
  if (!import.meta.env.DEV) return;
  const violacoes = verificarInvariantes(estado);
  if (violacoes.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`[OLYMPOS] Invariante violado (${contexto})`, violacoes);
  }
}

export interface JogadorNoSaguao {
  id: string;
  nome: string;
  avatar: string;
  conectado: boolean;
}

export interface Saguao {
  codigo: string;
  anfitriaoId: string | null;
  jogadores: JogadorNoSaguao[];
}

interface SessaoSalva {
  codigo: string;
  jogadorId: string;
}

function salvarSessao(sessao: SessaoSalva): void {
  sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

function lerSessaoSalva(): SessaoSalva | null {
  const bruto = sessionStorage.getItem(CHAVE_SESSAO);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as SessaoSalva;
  } catch {
    return null;
  }
}

function limparSessaoSalva(): void {
  sessionStorage.removeItem(CHAVE_SESSAO);
}

interface RespostaComMotivo {
  ok: boolean;
  motivo?: string;
}

export interface VotacaoEncerrar {
  votos: string[];
  necessarios: number;
}

export interface ItemDoFeed {
  id: number;
  evento: EventoJogo;
}

interface LojaPartida {
  modo: 'local' | 'online' | null;

  /** Única fonte de verdade pra UI, nos dois modos (Seção 18: nunca o EstadoJogo bruto). */
  estadoVisivel: EstadoVisivel | null;
  /** Fixo por conexão, só em modo online — quem sou eu na partida. */
  meuJogadorId: string | null;
  ultimoErro: string | null;

  /** Só em modo local: o motor roda no próprio cliente, que é a autoridade. */
  estadoLocal: EstadoJogo | null;

  /** Só em modo online, antes/durante o saguão. */
  saguao: Saguao | null;
  /** Nonce da última ação enviada, aguardando confirmação do servidor (só online). */
  pendente: string | null;
  /** Estado da votação de encerramento por abandono (Seção 17.6), só online. */
  votacaoEncerrar: VotacaoEncerrar | null;

  /** Eventos da atualização mais recente (Seção 17.5) — substituído, nunca acumulado. Ver useEventosDoJogo. */
  eventosNovos: EventoJogo[];
  /** Incrementa a cada atualização, mesmo se `eventosNovos` ficar vazio — dependency key pro consumidor. */
  eventosVersao: number;
  /** Log persistente pro feed narrativo, mais recente por último, capado em 50. */
  feed: ItemDoFeed[];

  iniciarPartidaLocal: (nomes: string[]) => void;

  entrarModoOnline: () => void;
  criarSala: (nome: string, avatar: string) => Promise<RespostaComMotivo>;
  entrarSala: (codigo: string, nome: string, avatar: string) => Promise<RespostaComMotivo>;
  sairSala: () => void;
  iniciarPartidaOnline: () => Promise<RespostaComMotivo>;
  votarEncerrar: (voto: boolean) => void;
  pedirRevanche: () => void;

  despachar: (acao: Acao) => void;
  limparErro: () => void;
  reiniciar: () => void;
}

/** Empurra um lote de eventos novos pro feed + pro consumo transiente (overlays, aria-live). Compartilhado entre o listener online e o diff local. */
function registrarEventosNovos(
  set: (parcial: Partial<LojaPartida>) => void,
  get: () => LojaPartida,
  eventos: EventoJogo[],
): void {
  if (eventos.length === 0) return;
  const itens = eventos.map((evento) => ({ id: proximoIdFeed++, evento }));
  const feed = [...get().feed, ...itens].slice(-TAMANHO_MAX_FEED);
  set({ feed, eventosNovos: eventos, eventosVersao: get().eventosVersao + 1 });
}

let listenersRegistrados = false;

function registrarListenersDeSocket(set: (parcial: Partial<LojaPartida>) => void, get: () => LojaPartida): void {
  if (listenersRegistrados) return;
  listenersRegistrados = true;

  const socket = conectarSocket();

  socket.on('connect', () => {
    const sessao = lerSessaoSalva();
    if (sessao && get().modo === 'online') {
      socket.emit('jogo:sincronizar', sessao);
    }
  });

  socket.on('sala:atualizada', (payload: { jogadores: JogadorNoSaguao[]; anfitriao: string | null; codigo: string }) => {
    set({
      saguao: { codigo: payload.codigo, anfitriaoId: payload.anfitriao, jogadores: payload.jogadores },
    });
  });

  socket.on('jogo:iniciado', (payload: { estadoVisivel: EstadoVisivel }) => {
    set({
      estadoVisivel: payload.estadoVisivel,
      ultimoErro: null,
      pendente: null,
      feed: [],
      eventosNovos: [],
      eventosVersao: 0,
    });
  });

  socket.on('jogo:estado', (payload: { versao: number; estadoVisivel: EstadoVisivel }) => {
    set({ estadoVisivel: payload.estadoVisivel, pendente: null });
  });

  socket.on('jogo:acao_rejeitada', (payload: { nonce: string; motivo: string }) => {
    if (get().pendente !== payload.nonce) return;
    set({ pendente: null, ultimoErro: payload.motivo });
  });

  socket.on('jogo:votacao_atualizada', (payload: VotacaoEncerrar) => {
    set({ votacaoEncerrar: payload });
  });

  socket.on('jogo:evento', (payload: { eventos: EventoJogo[] }) => {
    registrarEventosNovos(set, get, payload.eventos);
  });

  socket.on('sala:revanche_pronta', (payload: { codigo: string; jogadorId: string }) => {
    salvarSessao(payload);
    set({
      meuJogadorId: payload.jogadorId,
      estadoVisivel: null,
      saguao: null,
      votacaoEncerrar: null,
      ultimoErro: null,
      feed: [],
      eventosNovos: [],
      eventosVersao: 0,
    });
  });
}

export const usePartida = create<LojaPartida>((set, get) => ({
  modo: null,
  estadoVisivel: null,
  meuJogadorId: null,
  ultimoErro: null,
  estadoLocal: null,
  saguao: null,
  pendente: null,
  votacaoEncerrar: null,
  eventosNovos: [],
  eventosVersao: 0,
  feed: [],

  iniciarPartidaLocal: (nomes) => {
    const estado = criarPartida({
      partidaId: gerarId(),
      seed: gerarId(),
      jogadores: nomes.map((nome, i) => ({
        id: `jogador-${i + 1}`,
        nome,
        avatar: AVATARES[i % AVATARES.length]!,
      })),
    });
    checarInvariantesEmDev(estado, 'criarPartida');
    const jogadorDaVez = estado.jogadores[estado.jogadorAtual]!;
    set({
      modo: 'local',
      estadoLocal: estado,
      estadoVisivel: projetarPara(estado, jogadorDaVez.id),
      meuJogadorId: null,
      ultimoErro: null,
      feed: [],
      eventosNovos: [],
      eventosVersao: 0,
    });
  },

  entrarModoOnline: () => {
    registrarListenersDeSocket(set, get);
    if (get().modo !== 'online') {
      set({ modo: 'online', estadoLocal: null, estadoVisivel: null, saguao: null });
    }
    // Se o socket já estava conectado (voltando ao modo online na mesma aba),
    // o evento 'connect' não vai disparar de novo — rejunta direto aqui. Se
    // for a primeira conexão, o handler de 'connect' cuida disso sozinho.
    const socket = conectarSocket();
    const sessao = lerSessaoSalva();
    if (sessao && socket.connected) {
      socket.emit('jogo:sincronizar', sessao);
    }
  },

  criarSala: (nome, avatar) => {
    registrarListenersDeSocket(set, get);
    set({ modo: 'online', estadoLocal: null, estadoVisivel: null, ultimoErro: null });
    const socket = conectarSocket();
    return new Promise<RespostaComMotivo>((resolve) => {
      socket.emit(
        'sala:criar',
        { nome, avatar },
        (resposta: { salaId: string; codigo: string; jogadorId: string }) => {
          set({ meuJogadorId: resposta.jogadorId });
          salvarSessao({ codigo: resposta.codigo, jogadorId: resposta.jogadorId });
          resolve({ ok: true });
        },
      );
    });
  },

  entrarSala: (codigo, nome, avatar) => {
    registrarListenersDeSocket(set, get);
    set({ modo: 'online', estadoLocal: null, estadoVisivel: null, ultimoErro: null });
    const socket = conectarSocket();
    return new Promise<RespostaComMotivo>((resolve) => {
      socket.emit(
        'sala:entrar',
        { codigo, nome, avatar },
        (resposta: RespostaComMotivo & { jogadorId?: string }) => {
          if (resposta.ok && resposta.jogadorId) {
            set({ meuJogadorId: resposta.jogadorId });
            salvarSessao({ codigo, jogadorId: resposta.jogadorId });
          } else {
            set({ ultimoErro: resposta.motivo ?? null });
          }
          resolve(resposta);
        },
      );
    });
  },

  sairSala: () => {
    conectarSocket().emit('sala:sair');
    limparSessaoSalva();
    set({
      saguao: null,
      meuJogadorId: null,
      estadoVisivel: null,
      estadoLocal: null,
      modo: null,
      votacaoEncerrar: null,
    });
  },

  iniciarPartidaOnline: () => {
    const socket = conectarSocket();
    return new Promise<RespostaComMotivo>((resolve) => {
      socket.emit('sala:iniciar', {}, (resposta: RespostaComMotivo) => {
        if (!resposta.ok) set({ ultimoErro: resposta.motivo ?? null });
        resolve(resposta);
      });
    });
  },

  votarEncerrar: (voto) => {
    conectarSocket().emit('jogo:votar_encerrar', { voto });
  },

  pedirRevanche: () => {
    conectarSocket().emit('sala:revanche');
  },

  despachar: (acao) => {
    const { modo } = get();

    if (modo === 'online') {
      const nonce = gerarId();
      set({ pendente: nonce, ultimoErro: null });
      conectarSocket().emit('jogo:acao', { nonce, acao });
      return;
    }

    const atual = get().estadoLocal;
    if (!atual) return;

    const resultado = reduzir(atual, acao);
    if (!resultado.ok) {
      set({ ultimoErro: resultado.motivo });
      return;
    }

    checarInvariantesEmDev(resultado.valor, `após ${acao.tipo}`);
    const jogadorDaVez = resultado.valor.jogadores[resultado.valor.jogadorAtual]!;
    set({
      estadoLocal: resultado.valor,
      estadoVisivel: projetarPara(resultado.valor, jogadorDaVez.id),
      ultimoErro: null,
    });
    registrarEventosNovos(set, get, resultado.valor.historico.slice(atual.historico.length));
  },

  limparErro: () => set({ ultimoErro: null }),

  reiniciar: () => {
    if (get().modo === 'online') {
      desconectarSocket();
      listenersRegistrados = false;
      limparSessaoSalva();
    }
    set({
      modo: null,
      estadoLocal: null,
      estadoVisivel: null,
      meuJogadorId: null,
      saguao: null,
      pendente: null,
      votacaoEncerrar: null,
      ultimoErro: null,
      feed: [],
      eventosNovos: [],
      eventosVersao: 0,
    });
  },
}));
