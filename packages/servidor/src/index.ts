// Servidor Olympos — Seção 17 (protocolo online) e Seção 17.7 (deploy no
// Render, plano gratuito).
//
// Estado atual: só o saguão (sala:criar / sala:entrar) e o ciclo de presença
// de que a limpeza de salas depende estão implementados. `jogo:iniciar`,
// `jogo:acao`, `jogo:sincronizar` e o restante do protocolo da Seção 17.3
// ficam para quando packages/web também estiver migrado para o ruleset
// Marvel — não faz sentido despachar ações do motor antes disso.
//
// Sem Redis, sem Postgres: tudo vive no `Map` de RegistroDeSalas, perdido se
// o processo reiniciar ou hibernar. Ver Seção 17.7 para o porquê.

import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import cors from 'cors';
import express from 'express';
import { Server, type Socket } from 'socket.io';
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

interface SalaCriarPayload {
  nome: string;
  avatar: string;
}

interface SalaEntrarPayload {
  codigo: string;
  nome: string;
  avatar: string;
}

/** Preso ao socket só para saber o que limpar no disconnect (Seção 17.6). */
interface DadosDoSocket {
  codigo?: string;
  jogadorId?: string;
}

io.on('connection', (socket: Socket) => {
  const dados = socket.data as DadosDoSocket;

  socket.on(
    'sala:criar',
    (payload: SalaCriarPayload, ack?: (resposta: { salaId: string; codigo: string }) => void) => {
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

      ack?.({ salaId: sala.codigo, codigo: sala.codigo });
      io.to(sala.codigo).emit('sala:atualizada', {
        jogadores: [...sala.jogadores.values()],
        anfitriao: jogadorId,
        codigo: sala.codigo,
      });
    },
  );

  socket.on(
    'sala:entrar',
    (payload: SalaEntrarPayload, ack?: (resposta: { ok: boolean; motivo?: string }) => void) => {
      const sala = registroDeSalas.obter(payload.codigo);
      if (!sala) {
        ack?.({ ok: false, motivo: 'Sala não encontrada' });
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

      ack?.({ ok: true });
      io.to(sala.codigo).emit('sala:atualizada', {
        jogadores: [...sala.jogadores.values()],
        codigo: sala.codigo,
      });
    },
  );

  socket.on('disconnect', () => {
    if (dados.codigo && dados.jogadorId) {
      registroDeSalas.marcarDesconectado(dados.codigo, dados.jogadorId);
    }
  });
});

httpServer.listen(PORTA, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`[OLYMPOS] servidor ouvindo em 0.0.0.0:${PORTA}`);
});
