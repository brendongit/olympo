// Saguão online (Seção 17.2): criar/entrar numa sala, depois sala de espera
// até o anfitrião iniciar. Toda decisão de legalidade (quem pode iniciar,
// tamanho mínimo) já vem validada pelo servidor — este componente só monta
// o formulário e reage às respostas.

import { useState } from 'react';
import { usePartida } from '../loja/usePartida.js';

const AVATARES = ['🦉', '🔱', '🏹', '🛡️'];

export function TelaSaguao({ aoVoltar }: { aoVoltar: () => void }) {
  const saguao = usePartida((s) => s.saguao);
  const meuJogadorId = usePartida((s) => s.meuJogadorId);
  const ultimoErro = usePartida((s) => s.ultimoErro);
  const criarSala = usePartida((s) => s.criarSala);
  const entrarSala = usePartida((s) => s.entrarSala);
  const sairSala = usePartida((s) => s.sairSala);
  const iniciarPartidaOnline = usePartida((s) => s.iniciarPartidaOnline);
  const limparErro = usePartida((s) => s.limparErro);

  const [modoForm, setModoForm] = useState<'criar' | 'entrar'>('criar');
  const [nome, setNome] = useState('');
  const [avatar] = useState(() => AVATARES[Math.floor(Math.random() * AVATARES.length)]!);
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Já dentro de uma sala — inclusive por reconexão automática (Seção 17.4).
  if (saguao && meuJogadorId) {
    const souAnfitriao = saguao.anfitriaoId === meuJogadorId;
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950 p-6">
        <div className="w-full max-w-md rounded-xl border border-stone-800 bg-stone-900 p-8 shadow-xl">
          <h1 className="mb-1 text-center text-3xl font-serif font-bold tracking-wide text-amber-200">OLYMPOS</h1>
          <p className="mb-6 text-center text-sm text-stone-400">
            Sala <span className="font-mono font-semibold text-amber-300">{saguao.codigo}</span>
          </p>

          <ul className="mb-6 flex flex-col gap-2">
            {saguao.jogadores.map((j) => (
              <li
                key={j.id}
                className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-950/50 px-3 py-2"
              >
                <span className="text-xl">{j.avatar}</span>
                <span className="flex-1 text-stone-100">{j.nome}</span>
                {j.id === saguao.anfitriaoId && <span className="text-xs text-amber-400">anfitrião</span>}
                {!j.conectado && <span className="text-xs text-stone-600">offline</span>}
              </li>
            ))}
          </ul>

          {ultimoErro && <p className="mb-4 rounded bg-red-900/40 px-3 py-2 text-sm text-red-300">{ultimoErro}</p>}

          {souAnfitriao ? (
            <button
              type="button"
              disabled={saguao.jogadores.length < 2}
              onClick={() => iniciarPartidaOnline()}
              className="w-full rounded-lg bg-amber-500 py-3 font-semibold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-stone-800 disabled:text-stone-600"
            >
              {saguao.jogadores.length < 2 ? 'Aguardando mais jogadores…' : 'Iniciar partida'}
            </button>
          ) : (
            <p className="text-center text-sm text-stone-500">Aguardando o anfitrião iniciar…</p>
          )}

          <button
            type="button"
            onClick={() => {
              sairSala();
              aoVoltar();
            }}
            className="mt-3 w-full text-sm text-stone-500 hover:text-stone-300"
          >
            Sair da sala
          </button>
        </div>
      </div>
    );
  }

  async function enviar() {
    const nomeValido = nome.trim();
    if (!nomeValido) return;
    setEnviando(true);
    limparErro();
    if (modoForm === 'criar') {
      await criarSala(nomeValido, avatar);
    } else {
      await entrarSala(codigo.trim().toUpperCase(), nomeValido, avatar);
    }
    setEnviando(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-950 p-6">
      <div className="w-full max-w-md rounded-xl border border-stone-800 bg-stone-900 p-8 shadow-xl">
        <button type="button" onClick={aoVoltar} className="mb-4 text-sm text-stone-500 hover:text-stone-300">
          ← voltar
        </button>
        <h1 className="mb-1 text-center text-3xl font-serif font-bold tracking-wide text-amber-200">OLYMPOS</h1>
        <p className="mb-6 text-center text-sm text-stone-400">Jogo online</p>

        <div className="mb-6 flex gap-2">
          {(['criar', 'entrar'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModoForm(m)}
              className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition ${
                modoForm === m
                  ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                  : 'border-stone-700 text-stone-400 hover:border-stone-500'
              }`}
            >
              {m === 'criar' ? 'Criar sala' : 'Entrar em sala'}
            </button>
          ))}
        </div>

        <label className="mb-2 block text-sm font-medium text-stone-300">Seu nome</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Helena"
          maxLength={20}
          className="mb-4 w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-stone-100 placeholder-stone-600 focus:border-amber-400 focus:outline-none"
        />

        {modoForm === 'entrar' && (
          <>
            <label className="mb-2 block text-sm font-medium text-stone-300">Código da sala</label>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="OLY-4K2"
              maxLength={10}
              className="mb-4 w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 uppercase text-stone-100 placeholder-stone-600 focus:border-amber-400 focus:outline-none"
            />
          </>
        )}

        {ultimoErro && <p className="mb-4 rounded bg-red-900/40 px-3 py-2 text-sm text-red-300">{ultimoErro}</p>}

        <button
          type="button"
          disabled={!nome.trim() || (modoForm === 'entrar' && !codigo.trim()) || enviando}
          onClick={enviar}
          className="w-full rounded-lg bg-amber-500 py-3 font-semibold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-stone-800 disabled:text-stone-600"
        >
          {enviando ? 'Enviando…' : modoForm === 'criar' ? 'Criar sala' : 'Entrar'}
        </button>
      </div>
    </div>
  );
}
