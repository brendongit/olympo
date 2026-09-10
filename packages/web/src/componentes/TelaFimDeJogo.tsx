import type { EstadoJogo } from '@olympos/motor';
import { usePartida } from '../loja/usePartida.js';

export function TelaFimDeJogo({ estado }: { estado: EstadoJogo }) {
  const reiniciar = usePartida((s) => s.reiniciar);
  // Ordem de exibição (Seção 12.5): mais Kléos → quem tem Os Argonautas →
  // menos Lendas. Só para exibir o placar completo — quem venceu de fato já
  // vem pronto em estado.vencedores, calculado pelo motor.
  const ranking = [...estado.jogadores].sort(
    (a, b) =>
      b.kleos - a.kleos ||
      (estado.argonautas.dono === b.id ? 1 : 0) - (estado.argonautas.dono === a.id ? 1 : 0) ||
      a.lendas.length - b.lendas.length,
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-stone-950 p-6">
      <h1 className="font-serif text-4xl font-bold text-amber-200">Fim de partida</h1>
      <p className="text-stone-400">
        {estado.vencedores.length > 1 ? 'Vitória compartilhada' : 'Vencedor'}:{' '}
        <span className="font-semibold text-amber-300">
          {estado.vencedores
            .map((id) => estado.jogadores.find((j) => j.id === id)?.nome)
            .filter(Boolean)
            .join(' e ')}
        </span>
      </p>

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
                  estado.vencedores.includes(j.id) ? 'bg-amber-400/10' : ''
                }`}
              >
                <td className="px-3 py-2 text-stone-500">{i + 1}</td>
                <td className="px-3 py-2 font-medium text-stone-100">
                  {j.avatar} {j.nome}
                </td>
                <td className="px-3 py-2 font-bold text-amber-300">{j.kleos}</td>
                <td className="px-3 py-2 text-stone-400">{j.lendas.length}</td>
                <td className="px-3 py-2 text-stone-400">{j.santuarios.length}</td>
                <td className="px-3 py-2 text-stone-400">{estado.argonautas.dono === j.id ? '⛵' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={reiniciar}
        className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-stone-950 hover:bg-amber-400"
      >
        Nova partida
      </button>
    </div>
  );
}
