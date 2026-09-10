// Cliente Socket.IO — Seção 17.1 e 17.7 (deploy no Render, plano gratuito).
//
// `reconnectionAttempts: Infinity` e `reconnectionDelayMax` de 5s (decisão 5
// do deploy): é o que permite ao jogo sobreviver a uma queda de rede do
// jogador — e, de quebra, a uma hibernação do servidor no meio de uma sessão
// ociosa — sem abandonar a partida.

import { io, type Socket } from 'socket.io-client';

const URL_SERVIDOR = import.meta.env.VITE_SERVIDOR_URL;

let socket: Socket | null = null;

/**
 * Cria (ou reaproveita) o socket para o servidor.
 *
 * Só deve ser chamada depois que `useServidorAcordado`/`TelaDespertando`
 * confirmar que `GET /health` respondeu — nunca antes disso. No plano
 * gratuito do Render, o primeiro handshake contra um serviço dormindo pode
 * levar ~1 minuto; abrir o socket direto só gera tentativas de conexão
 * fracassadas em vez de aproveitar o feedback claro da tela de despertar.
 */
export function conectarSocket(): Socket {
  if (socket) return socket;
  if (!URL_SERVIDOR) {
    throw new Error('VITE_SERVIDOR_URL não configurada — veja render.yaml / Seção 17.7');
  }

  socket = io(URL_SERVIDOR, {
    reconnectionAttempts: Infinity,
    reconnectionDelayMax: 5_000,
  });

  return socket;
}

export function desconectarSocket(): void {
  socket?.disconnect();
  socket = null;
}
