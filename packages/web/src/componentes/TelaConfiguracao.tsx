import { useState } from 'react';
import { usePartida } from '../loja/usePartida.js';

const NOMES_PADRAO = ['Helena', 'Rafael', 'Ariadne', 'Teseu'];

export function TelaConfiguracao() {
  const iniciarPartida = usePartida((s) => s.iniciarPartida);
  const [numeroJogadores, setNumeroJogadores] = useState(2);
  const [nomes, setNomes] = useState<string[]>(NOMES_PADRAO.slice(0, 2));

  function ajustarNumeroJogadores(n: number) {
    setNumeroJogadores(n);
    setNomes((atual) => {
      const proximos = [...atual];
      while (proximos.length < n) proximos.push(NOMES_PADRAO[proximos.length] ?? `Jogador ${proximos.length + 1}`);
      return proximos.slice(0, n);
    });
  }

  function comecar() {
    const nomesValidos = nomes.map((n, i) => (n.trim() ? n.trim() : `Jogador ${i + 1}`));
    iniciarPartida(nomesValidos);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-950 p-6">
      <div className="w-full max-w-md rounded-xl border border-stone-800 bg-stone-900 p-8 shadow-xl">
        <h1 className="mb-1 text-center text-3xl font-serif font-bold tracking-wide text-amber-200">OLYMPOS</h1>
        <p className="mb-6 text-center text-sm text-stone-400">Modo local — todos os jogadores na mesma tela</p>

        <label className="mb-2 block text-sm font-medium text-stone-300">Número de jogadores</label>
        <div className="mb-6 flex gap-2">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => ajustarNumeroJogadores(n)}
              className={`flex-1 rounded-lg border py-2 text-lg font-semibold transition ${
                numeroJogadores === n
                  ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                  : 'border-stone-700 text-stone-400 hover:border-stone-500'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <label className="mb-2 block text-sm font-medium text-stone-300">Nomes</label>
        <div className="mb-8 flex flex-col gap-2">
          {nomes.map((nome, i) => (
            <input
              key={i}
              value={nome}
              onChange={(e) =>
                setNomes((atual) => atual.map((n, idx) => (idx === i ? e.target.value : n)))
              }
              placeholder={NOMES_PADRAO[i] ?? `Jogador ${i + 1}`}
              maxLength={20}
              className="rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-stone-100 placeholder-stone-600 focus:border-amber-400 focus:outline-none"
            />
          ))}
        </div>

        <button
          type="button"
          onClick={comecar}
          className="w-full rounded-lg bg-amber-500 py-3 font-semibold text-stone-950 transition hover:bg-amber-400"
        >
          Iniciar partida
        </button>
      </div>
    </div>
  );
}
