// Votação de encerramento por abandono (Seção 17.6). Qualquer jogador
// conectado pode votar; ao atingir maioria, o SERVIDOR encerra a partida
// sem vencedores — o cliente só mostra a contagem e alterna o próprio voto.

import type { EstadoVisivel } from '@olympos/motor';
import { usePartida } from '../loja/usePartida.js';

export function PainelVotacaoEncerrar({ estadoVisivel }: { estadoVisivel: EstadoVisivel }) {
  const modo = usePartida((s) => s.modo);
  const votacaoEncerrar = usePartida((s) => s.votacaoEncerrar);
  const meuJogadorId = usePartida((s) => s.meuJogadorId);
  const votarEncerrar = usePartida((s) => s.votarEncerrar);

  if (modo !== 'online') return null;
  if (estadoVisivel.fase !== 'EM_ANDAMENTO' && estadoVisivel.fase !== 'ULTIMA_RODADA') return null;

  const meuVoto = meuJogadorId !== null && (votacaoEncerrar?.votos.includes(meuJogadorId) ?? false);

  return (
    <div className="mx-2 my-1 flex shrink-0 items-center gap-2 rounded-lg border border-stone-800 bg-stone-900/60 px-3 py-1.5 text-xs">
      <span className="text-stone-400">
        {votacaoEncerrar
          ? `${votacaoEncerrar.votos.length}/${votacaoEncerrar.necessarios} votos pra encerrar`
          : 'ninguém votou pra encerrar ainda'}
      </span>
      <button
        type="button"
        onClick={() => votarEncerrar(!meuVoto)}
        className={`rounded px-2 py-1 font-semibold ${
          meuVoto ? 'bg-red-800 text-red-100 hover:bg-red-700' : 'bg-stone-700 text-stone-100 hover:bg-stone-600'
        }`}
      >
        {meuVoto ? 'Retirar voto' : 'Votar pra encerrar'}
      </button>
    </div>
  );
}
