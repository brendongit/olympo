import type { EstadoVisivel } from '@olympos/motor';
import { usePartida } from '../loja/usePartida.js';

export function TelaFimDeJogo({ estadoVisivel }: { estadoVisivel: EstadoVisivel }) {
  const reiniciar = usePartida((s) => s.reiniciar);
  const modo = usePartida((s) => s.modo);
  const meuJogadorId = usePartida((s) => s.meuJogadorId);
  const anfitriaoId = usePartida((s) => s.saguao?.anfitriaoId ?? null);
  const pedirRevanche = usePartida((s) => s.pedirRevanche);
  const sairSala = usePartida((s) => s.sairSala);

  // Ordem de exibição (Seção 12.5): mais Kléos → quem tem Os Argonautas →
  // menos Lendas. Só para exibir o placar completo — quem venceu de fato já
  // vem pronto em estadoVisivel.vencedores, calculado pelo motor.
  const ranking = [...estadoVisivel.jogadores].sort(
    (a, b) =>
      b.kleos - a.kleos ||
      (estadoVisivel.argonautas.dono === b.id ? 1 : 0) - (estadoVisivel.argonautas.dono === a.id ? 1 : 0) ||
      a.lendas.length - b.lendas.length,
  );

  const souAnfitriao = modo === 'online' && anfitriaoId !== null && anfitriaoId === meuJogadorId;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-stone-950 p-6">
      <h1 className="font-serif text-4xl font-bold text-amber-200">Fim de partida</h1>

      {estadoVisivel.encerradaPorAbandono ? (
        <p className="text-stone-400">
          Partida <span className="font-semibold text-red-300">encerrada por abandono</span> — a maioria dos
          jogadores conectados votou pra encerrar.
        </p>
      ) : (
        <p className="text-stone-400">
          {estadoVisivel.vencedores.length > 1 ? 'Vitória compartilhada' : 'Vencedor'}:{' '}
          <span className="font-semibold text-amber-300">
            {estadoVisivel.vencedores
              .map((id) => estadoVisivel.jogadores.find((j) => j.id === id)?.nome)
              .filter(Boolean)
              .join(' e ')}
          </span>
        </p>
      )}

      <div className="w-full max-w-md overflow-hidden rounded-xl border border-stone-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-900 text-stone-400">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Jogador</th>
              <th className="px-3 py-2">Kléos</th>
              <th className="px-3 py-2">Lendas</th>
              <th className="px-3 py-2">Santuários</th>
              <th className="px-3 py-2">Os Argonautas</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((j, i) => (
              <tr
                key={j.id}
                className={`border-t border-stone-800 ${
                  estadoVisivel.vencedores.includes(j.id) ? 'bg-amber-400/10' : ''
                }`}
              >
                <td className="px-3 py-2 text-stone-500">{i + 1}</td>
                <td className="px-3 py-2 font-medium text-stone-100">
                  {j.avatar} {j.nome}
                </td>
                <td className="px-3 py-2 font-bold text-amber-300">{j.kleos}</td>
                <td className="px-3 py-2 text-stone-400">{j.lendas.length}</td>
                <td className="px-3 py-2 text-stone-400">{j.santuarios.length}</td>
                <td className="px-3 py-2 text-stone-400">{estadoVisivel.argonautas.dono === j.id ? '⛵' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modo === 'local' ? (
        <button
          type="button"
          onClick={reiniciar}
          className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-stone-950 hover:bg-amber-400"
        >
          Nova partida
        </button>
      ) : (
        <div className="flex flex-col items-center gap-3">
          {souAnfitriao ? (
            <button
              type="button"
              onClick={pedirRevanche}
              className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-stone-950 hover:bg-amber-400"
            >
              Revanche
            </button>
          ) : (
            <p className="text-sm text-stone-500">Aguardando o anfitrião pedir revanche…</p>
          )}
          <button type="button" onClick={sairSala} className="text-sm text-stone-500 hover:text-stone-300">
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
