// Servidor Olympos — Seção 17 (protocolo online) e Seção 17.7 (deploy no
// Render, plano gratuito).
//
// Fase 4 (Seção 21.2): saguão completo (criar/entrar/sair/iniciar), jogo
// autoritativo (jogo:acao validado e aplicado com o MESMO motor puro do
// cliente), projeção pública/privada por jogador (Seção 18) e reconexão
// básica via jogo:sincronizar.
//
// Fase 5: timer de turno com ação automática (Seção 17.6), marcação de
// ausência, votação de encerramento por abandono e revanche.
//
// Sem Redis, sem Postgres: tudo vive no `Map` de RegistroDeSalas, perdido se
// o processo reiniciar ou hibernar. Ver Seção 17.7 para o porquê.

import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import cors from 'cors';
import express from 'express';
import { Server, type Socket } from 'socket.io';
import type { Acao, EstadoJogo, EstadoVisivel } from '@olympos/motor';
import { criarPartida, DURACAO_TURNO_MS, projetarPara, verificarInvariantes } from '@olympos/motor';
import { colheitaAutomatica, devolucaoAutomatica, santuarioAutomatico } from './acaoAutomatica.js';
import { gerarCodigoDeSala } from './codigo.js';
import { RegistroDeSalas, type Sala } from './salas.js';

const PORTA = Number(process.env.PORT) || 3001;
const ORIGEM_PERMITIDA = process.env.ORIGEM_PERMITIDA;

if (!ORIGEM_PERMITIDA) {
  // eslint-disable-next-line no-console
  console.warn('[OLYMPOS] ORIGEM_PERMITIDA não definida — CORS vai rejeitar toda origem de navegador.');
}

const app = express();
app.use(cors({ origin: ORIGEM_PERMITIDA ?? false }));

// GET /health responde imediatamente, sem depender de sala ou estado algum —
// é o endpoint que a tela de despertar do cliente faz polling a cada 2s até
// o serviço acordar (Seção 17.7).
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: ORIGEM_PERMITIDA ?? false },
});

const registroDeSalas = new RegistroDeSalas();

function criarSalaComCodigoUnico(): Sala {
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const codigo = gerarCodigoDeSala();
    if (!registroDeSalas.obter(codigo)) {
      return registroDeSalas.criar(codigo);
    }
  }
  throw new Error('Não foi possível gerar um código de sala único');
}

function payloadSalaAtualizada(sala: Sala) {
  return {
    jogadores: [...sala.jogadores.values()].map(({ id, nome, avatar, socketId }) => ({
      id,
      nome,
      avatar,
      conectado: socketId !== null,
    })),
    anfitriao: sala.anfitriaoId,
    codigo: sala.codigo,
  };
}

/** Emite um evento individualmente pra cada jogador CONECTADO da sala, com um payload que pode depender de quem recebe (Seção 18: a projeção é por jogador). */
function emitirPorJogador(sala: Sala, evento: string, montarPayload: (jogadorId: string) => unknown): void {
  for (const jogador of sala.jogadores.values()) {
    if (jogador.socketId === null) continue;
    io.to(jogador.socketId).emit(evento, montarPayload(jogador.id));
  }
}

function emitirEstadoDoJogo(sala: Sala): void {
  if (!sala.partida) return;
  const partida = sala.partida;
  emitirPorJogador(sala, 'jogo:estado', (jogadorId) => ({
    versao: sala.versao,
    estadoVisivel: projetarPara(partida, jogadorId),
  }));
}

function contarConectados(sala: Sala): number {
  let n = 0;
  for (const jogador of sala.jogadores.values()) {
    if (jogador.socketId !== null) n++;
  }
  return n;
}

/** Maioria dos jogadores conectados — Seção 17.6, "a sala oferece votação para encerrar". */
function votosNecessarios(sala: Sala): number {
  return Math.floor(contarConectados(sala) / 2) + 1;
}

function emitirVotacaoAtualizada(sala: Sala): void {
  io.to(sala.codigo).emit('jogo:votacao_atualizada', {
    votos: [...sala.votosEncerrar],
    necessarios: votosNecessarios(sala),
  });
}

/** Regra não-negociável do CLAUDE.md: verificarInvariantes() roda após toda ação em dev. */
function checarInvariantesEmDev(estado: EstadoJogo, contexto: string): void {
  if (process.env.NODE_ENV === 'production') return;
  const violacoes = verificarInvariantes(estado);
  if (violacoes.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`[OLYMPOS] Invariante violado (${contexto})`, violacoes);
  }
}

/**
 * Agenda a ação automática do próximo turno (Seção 17.6): estampa
 * `atualizadoEm`/`prazoDoTurno` (marcas de tempo reais — responsabilidade do
 * servidor, nunca do motor puro) e programa o disparo em `DURACAO_TURNO_MS`.
 * Chamada depois de toda mutação de `sala.partida` — início de partida,
 * ação de jogador, ou o disparo automático anterior (reagenda o próximo).
 */
function agendarProximoTurno(sala: Sala): void {
  if (sala.timerTurno) {
    clearTimeout(sala.timerTurno);
    sala.timerTurno = null;
  }
  if (!sala.partida || sala.partida.fase === 'ENCERRADO') return;

  sala.partida.atualizadoEm = Date.now();
  sala.partida.prazoDoTurno = Date.now() + DURACAO_TURNO_MS;

  sala.timerTurno = setTimeout(() => dispararAcaoAutomatica(sala.codigo), DURACAO_TURNO_MS);
}

/**
 * Decide e submete a ação automática certa pra sub-fase pendente no momento
 * em que o timer do turno estoura, incrementa `turnosAusente` do jogador
 * afetado (bookkeeping de presença, mutado direto como `conectado` — não é
 * uma regra do motor) e reagenda o próximo turno.
 */
function dispararAcaoAutomatica(codigo: string): void {
  const sala = registroDeSalas.obter(codigo);
  if (!sala || !sala.partida || sala.partida.fase === 'ENCERRADO') return;
  const estado = sala.partida;

  let acao: Acao;
  let jogadorAfetadoId: string;

  if (estado.subFase === 'DESCARTANDO' && estado.descartePendente) {
    jogadorAfetadoId = estado.descartePendente.jogadorId;
    const jogador = estado.jogadores.find((j) => j.id === jogadorAfetadoId)!;
    acao = {
      tipo: 'DEVOLVER_FICHAS',
      jogadorId: jogadorAfetadoId,
      fichas: devolucaoAutomatica(jogador, estado.descartePendente.excedente),
    };
  } else if (estado.subFase === 'ESCOLHENDO_SANTUARIO' && estado.escolhaSantuarioPendente) {
    jogadorAfetadoId = estado.escolhaSantuarioPendente.jogadorId;
    acao = {
      tipo: 'ESCOLHER_SANTUARIO',
      jogadorId: jogadorAfetadoId,
      santuarioId: santuarioAutomatico(estado.escolhaSantuarioPendente),
    };
  } else {
    jogadorAfetadoId = estado.jogadores[estado.jogadorAtual]!.id;
    acao = colheitaAutomatica(estado);
  }

  const resultado = registroDeSalas.aplicarAcao(sala.codigo, acao);
  if (resultado.ok) {
    checarInvariantesEmDev(resultado.valor, `ação automática ${acao.tipo}`);
    const jogadorNaPartida = resultado.valor.jogadores.find((j) => j.id === jogadorAfetadoId);
    if (jogadorNaPartida) jogadorNaPartida.turnosAusente += 1;
    emitirEstadoDoJogo(sala);
  }
  // Se a ação automática for rejeitada (raro — ver Seção 17.6, caso de borda
  // do reservatório vazio mas reservar/reivindicar ainda legal), não trava a
  // sala: só reagenda outro ciclo em vez de travar sem reação nenhuma.
  agendarProximoTurno(sala);
}

interface SalaCriarPayload {
  nome: string;
  avatar: string;
}

interface SalaEntrarPayload {
  codigo: string;
  nome: string;
  avatar: string;
}

interface JogoAcaoPayload {
  nonce: string;
  acao: Acao;
}

interface JogoSincronizarPayload {
  codigo: string;
  jogadorId: string;
}

/** Preso ao socket só para saber o que limpar no disconnect (Seção 17.6). */
interface DadosDoSocket {
  codigo?: string;
  jogadorId?: string;
}

/** Reatribui este socket a um jogador já existente na sala — usado tanto por sala:entrar quanto por jogo:sincronizar (rejuntar depois de reload/reconexão). */
function reconectarSocket(socket: Socket, sala: Sala, jogadorId: string): void {
  const dados = socket.data as DadosDoSocket;
  const jogador = sala.jogadores.get(jogadorId);
  if (!jogador) return;
  jogador.socketId = socket.id;
  dados.codigo = sala.codigo;
  dados.jogadorId = jogadorId;
  void socket.join(sala.codigo);
}

io.on('connection', (socket: Socket) => {
  const dados = socket.data as DadosDoSocket;

  socket.on(
    'sala:criar',
    (payload: SalaCriarPayload, ack?: (resposta: { salaId: string; codigo: string; jogadorId: string }) => void) => {
      const sala = criarSalaComCodigoUnico();
      const jogadorId = randomUUID();

      registroDeSalas.adicionarJogador(sala.codigo, {
        id: jogadorId,
        nome: payload.nome,
        avatar: payload.avatar,
        socketId: socket.id,
      });

      dados.codigo = sala.codigo;
      dados.jogadorId = jogadorId;
      void socket.join(sala.codigo);

      ack?.({ salaId: sala.codigo, codigo: sala.codigo, jogadorId });
      io.to(sala.codigo).emit('sala:atualizada', payloadSalaAtualizada(sala));
    },
  );

  socket.on(
    'sala:entrar',
    (
      payload: SalaEntrarPayload,
      ack?: (resposta: { ok: boolean; motivo?: string; jogadorId?: string }) => void,
    ) => {
      const sala = registroDeSalas.obter(payload.codigo);
      if (!sala) {
        ack?.({ ok: false, motivo: 'Sala não encontrada' });
        return;
      }
      if (sala.partida) {
        ack?.({ ok: false, motivo: 'A partida já começou' });
        return;
      }
      if (sala.jogadores.size >= 4) {
        ack?.({ ok: false, motivo: 'Sala cheia' });
        return;
      }

      const jogadorId = randomUUID();
      registroDeSalas.adicionarJogador(sala.codigo, {
        id: jogadorId,
        nome: payload.nome,
        avatar: payload.avatar,
        socketId: socket.id,
      });

      dados.codigo = sala.codigo;
      dados.jogadorId = jogadorId;
      void socket.join(sala.codigo);

      ack?.({ ok: true, jogadorId });
      io.to(sala.codigo).emit('sala:atualizada', payloadSalaAtualizada(sala));
    },
  );

  socket.on('sala:sair', () => {
    if (!dados.codigo || !dados.jogadorId) return;
    const sala = registroDeSalas.obter(dados.codigo);
    // Sair vale no saguão OU depois que a partida termina — nunca no meio de
    // uma partida em andamento (aí é desconexão, tratada no disconnect).
    if (!sala || (sala.partida && sala.partida.fase !== 'ENCERRADO')) return;

    registroDeSalas.removerJogador(dados.codigo, dados.jogadorId);
    void socket.leave(dados.codigo);
    io.to(dados.codigo).emit('sala:atualizada', payloadSalaAtualizada(sala));
    dados.codigo = undefined;
    dados.jogadorId = undefined;
  });

  socket.on('sala:iniciar', (_payload: Record<string, never>, ack?: (r: { ok: boolean; motivo?: string }) => void) => {
    if (!dados.codigo || !dados.jogadorId) {
      ack?.({ ok: false, motivo: 'Você não está em uma sala' });
      return;
    }
    const sala = registroDeSalas.obter(dados.codigo);
    if (!sala) {
      ack?.({ ok: false, motivo: 'Sala não encontrada' });
      return;
    }
    if (sala.anfitriaoId !== dados.jogadorId) {
      ack?.({ ok: false, motivo: 'Só o anfitrião pode iniciar a partida' });
      return;
    }
    if (sala.partida) {
      ack?.({ ok: false, motivo: 'A partida já começou' });
      return;
    }
    if (sala.jogadores.size < 2) {
      ack?.({ ok: false, motivo: 'É preciso pelo menos 2 jogadores' });
      return;
    }

    const estadoInicial: EstadoJogo = criarPartida({
      partidaId: sala.codigo,
      seed: randomUUID(),
      jogadores: [...sala.jogadores.values()].map(({ id, nome, avatar }) => ({ id, nome, avatar })),
    });
    registroDeSalas.iniciarPartida(sala.codigo, estadoInicial);
    agendarProximoTurno(sala);

    ack?.({ ok: true });
    emitirPorJogador(sala, 'jogo:iniciado', (jogadorId) => ({
      estadoVisivel: projetarPara(estadoInicial, jogadorId) satisfies EstadoVisivel,
    }));
  });

  socket.on('jogo:acao', (payload: JogoAcaoPayload, ack?: (r: { ok: boolean; motivo?: string }) => void) => {
    if (!dados.codigo || !dados.jogadorId) {
      ack?.({ ok: false, motivo: 'Você não está em uma sala' });
      return;
    }
    const sala = registroDeSalas.obter(dados.codigo);
    if (!sala || !sala.partida) {
      ack?.({ ok: false, motivo: 'Nenhuma partida em andamento' });
      return;
    }
    if (registroDeSalas.nonceJaVisto(sala.codigo, dados.jogadorId, payload.nonce)) {
      return; // duplicata (double-click, reenvio) — Seção 17.1, descartada em silêncio
    }

    // A identidade nunca vem do payload — sempre da sessão do socket (Seção 17.1).
    const acao: Acao = { ...payload.acao, jogadorId: dados.jogadorId };
    const resultado = registroDeSalas.aplicarAcao(sala.codigo, acao);

    if (!resultado.ok) {
      socket.emit('jogo:acao_rejeitada', { nonce: payload.nonce, motivo: resultado.motivo });
      ack?.({ ok: false, motivo: resultado.motivo });
      return;
    }

    checarInvariantesEmDev(resultado.valor, `após ${payload.acao.tipo}`);

    // O jogador agiu por conta própria — não está mais ausente.
    const jogadorAtor = resultado.valor.jogadores.find((j) => j.id === dados.jogadorId);
    if (jogadorAtor) jogadorAtor.turnosAusente = 0;

    agendarProximoTurno(sala);
    ack?.({ ok: true });
    emitirEstadoDoJogo(sala);
  });

  // Revanche (Seção 17.2): "nova sala, mesmos jogadores". Só o anfitrião
  // pode pedir, e só depois que a partida terminou. Migra quem estiver
  // CONECTADO pra uma sala nova, com jogadorId novo (é sempre escopado à
  // sala) — quem estiver desconectado no momento fica de fora.
  socket.on('sala:revanche', () => {
    if (!dados.codigo || !dados.jogadorId) return;
    const salaAntiga = registroDeSalas.obter(dados.codigo);
    if (!salaAntiga || salaAntiga.anfitriaoId !== dados.jogadorId) return;
    if (!salaAntiga.partida || salaAntiga.partida.fase !== 'ENCERRADO') return;

    const salaNova = criarSalaComCodigoUnico();

    for (const jogador of salaAntiga.jogadores.values()) {
      if (jogador.socketId === null) continue;
      const socketMigrado = io.sockets.sockets.get(jogador.socketId);
      if (!socketMigrado) continue;

      const novoJogadorId = randomUUID();
      registroDeSalas.adicionarJogador(salaNova.codigo, {
        id: novoJogadorId,
        nome: jogador.nome,
        avatar: jogador.avatar,
        socketId: socketMigrado.id,
      });
      registroDeSalas.marcarDesconectado(salaAntiga.codigo, jogador.id);

      void socketMigrado.leave(salaAntiga.codigo);
      void socketMigrado.join(salaNova.codigo);

      const dadosMigrados = socketMigrado.data as DadosDoSocket;
      dadosMigrados.codigo = salaNova.codigo;
      dadosMigrados.jogadorId = novoJogadorId;

      socketMigrado.emit('sala:revanche_pronta', { codigo: salaNova.codigo, jogadorId: novoJogadorId });
    }

    io.to(salaNova.codigo).emit('sala:atualizada', payloadSalaAtualizada(salaNova));
  });

  // Vota (ou retira o voto) para encerrar a partida por abandono (Seção
  // 17.6). Qualquer jogador conectado pode votar — não só o anfitrião.
  // Ao atingir maioria dos conectados, encerra sem vencedores (declarar
  // vencedor por votação violaria a Seção 5).
  socket.on('jogo:votar_encerrar', (payload: { voto: boolean }) => {
    if (!dados.codigo || !dados.jogadorId) return;
    const sala = registroDeSalas.obter(dados.codigo);
    if (!sala || !sala.partida) return;

    if (payload.voto) {
      sala.votosEncerrar.add(dados.jogadorId);
    } else {
      sala.votosEncerrar.delete(dados.jogadorId);
    }

    if (sala.votosEncerrar.size >= votosNecessarios(sala)) {
      const resultado = registroDeSalas.aplicarAcao(sala.codigo, {
        tipo: 'ENCERRAR_ABANDONO',
        jogadorId: dados.jogadorId,
      });
      if (resultado.ok) {
        checarInvariantesEmDev(resultado.valor, 'ENCERRAR_ABANDONO por votação');
        sala.votosEncerrar.clear();
        agendarProximoTurno(sala); // limpa o timer de turno — fase já é ENCERRADO
        emitirEstadoDoJogo(sala);
        return;
      }
    }

    emitirVotacaoAtualizada(sala);
  });

  // Cobre tanto "me manda o estado atual" quanto rejuntar depois de um
  // reload/reconexão — este socket é novo e ainda não tem `dados.codigo`.
  // Extensão pragmática do payload da Seção 17.3 (lá é só `{ultimaVersao}`,
  // assumindo uma sessão já autenticada); sem isso um F5 no meio da partida
  // trancaria o jogador pra fora até acumular `turnosAusente` suficiente.
  socket.on('jogo:sincronizar', (payload: JogoSincronizarPayload, ack?: (r: { ok: boolean; motivo?: string }) => void) => {
    const sala = registroDeSalas.obter(payload.codigo);
    if (!sala || !sala.jogadores.has(payload.jogadorId)) {
      ack?.({ ok: false, motivo: 'Sessão inválida — a sala ou o jogador não existem mais' });
      return;
    }

    reconectarSocket(socket, sala, payload.jogadorId);
    ack?.({ ok: true });

    if (sala.partida) {
      const partida = sala.partida;
      socket.emit('jogo:estado', { versao: sala.versao, estadoVisivel: projetarPara(partida, payload.jogadorId) });
    } else {
      socket.emit('sala:atualizada', payloadSalaAtualizada(sala));
    }
  });

  socket.on('disconnect', () => {
    if (!dados.codigo || !dados.jogadorId) return;
    const sala = registroDeSalas.obter(dados.codigo);
    if (!sala) return;

    if (sala.partida) {
      const jogadorNaPartida = sala.partida.jogadores.find((j) => j.id === dados.jogadorId);
      if (jogadorNaPartida) jogadorNaPartida.conectado = false;
      const jogadorNaSala = sala.jogadores.get(dados.jogadorId);
      if (jogadorNaSala) jogadorNaSala.socketId = null;
      registroDeSalas.marcarDesconectado(dados.codigo, dados.jogadorId);
      io.to(dados.codigo).emit('jogador:conexao', { jogadorId: dados.jogadorId, conectado: false });
      emitirEstadoDoJogo(sala);

      // O quórum muda com menos gente conectada — remove o voto e reavisa.
      if (sala.votosEncerrar.delete(dados.jogadorId)) {
        emitirVotacaoAtualizada(sala);
      }
    } else {
      registroDeSalas.marcarDesconectado(dados.codigo, dados.jogadorId);
      io.to(dados.codigo).emit('sala:atualizada', payloadSalaAtualizada(sala));
    }
  });
});

httpServer.listen(PORTA, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`[OLYMPOS] servidor ouvindo em 0.0.0.0:${PORTA}`);
});
