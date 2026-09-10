// Reservatório mobile (Seção 17.4 item 2 e 17.6). Toda legalidade continua
// vindo de podeColherDiferentes/podeColherIguais — este componente só junta
// gestos de toque (toque simples, toque longo, duplo-toque) e decide QUANDO
// despachar, nunca SE é legal.

import { useEffect, useRef, useState } from 'react';
import type { Essencia, EstadoJogo } from '@olympos/motor';
import { podeColherIguais } from '@olympos/motor';
import { INFO_FICHA, ORDEM_FICHAS } from '../lib/tema.js';
import { usePartida } from '../loja/usePartida.js';

const ATRASO_TOQUE_LONGO_MS = 300;
const JANELA_DUPLO_TOQUE_MS = 350;
const ATRASO_CONFIRMACAO_MS = 400;

export function ReservatorioMobile({ estado }: { estado: EstadoJogo }) {
  const despachar = usePartida((s) => s.despachar);
  const [selecionadas, setSelecionadas] = useState<Essencia[]>([]);
  const [confirmando, setConfirmando] = useState(false);
  const [avisoCadeado, setAvisoCadeado] = useState<string | null>(null);
  const jogadorId = estado.jogadores[estado.jogadorAtual]!.id;

  const toqueLongoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toqueLongoDisparouRef = useRef(false);
  const ultimoToqueRef = useRef<Record<string, number>>({});
  const confirmacaoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avisoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const disponiveis = (['eter', 'oceano', 'terra', 'chama', 'sombra'] as const).filter(
    (e) => estado.reservatorio[e] > 0,
  );
  const maximo = Math.min(3, disponiveis.length);
  const emEscolhendoAcao = estado.subFase === 'ESCOLHENDO_ACAO';

  // Ao completar a seleção de 3 diferentes, confirma sozinho após 400ms —
  // com uma janela para desfazer, em vez de despachar na hora (Seção 17.6).
  useEffect(() => {
    if (maximo > 0 && selecionadas.length === maximo && !confirmando) {
      setConfirmando(true);
      confirmacaoRef.current = setTimeout(() => {
        despachar({ tipo: 'COLHER_DIFERENTES', jogadorId, essencias: selecionadas });
        setSelecionadas([]);
        setConfirmando(false);
      }, ATRASO_CONFIRMACAO_MS);
    }
    return () => {
      if (confirmacaoRef.current) clearTimeout(confirmacaoRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecionadas, maximo]);

  function desfazer() {
    if (confirmacaoRef.current) clearTimeout(confirmacaoRef.current);
    setConfirmando(false);
    setSelecionadas([]);
  }

  function alternar(e: Essencia) {
    if (!emEscolhendoAcao || confirmando) return;
    setSelecionadas((atual) => {
      if (atual.includes(e)) return atual.filter((x) => x !== e);
      if (atual.length >= maximo) return atual;
      return [...atual, e];
    });
  }

  function tentarColherIguais(e: Essencia) {
    const resultado = podeColherIguais(estado, jogadorId, e);
    if (resultado.ok) {
      despachar({ tipo: 'COLHER_IGUAIS', jogadorId, essencia: e });
      setSelecionadas([]);
      return;
    }
    setAvisoCadeado(resultado.motivo);
    if (avisoRef.current) clearTimeout(avisoRef.current);
    avisoRef.current = setTimeout(() => setAvisoCadeado(null), 1800);
  }

  function aoPressionar(e: Essencia) {
    if (!emEscolhendoAcao || confirmando || estado.reservatorio[e] === 0) return;
    toqueLongoDisparouRef.current = false;
    toqueLongoRef.current = setTimeout(() => {
      toqueLongoDisparouRef.current = true;
      tentarColherIguais(e);
    }, ATRASO_TOQUE_LONGO_MS);
  }

  function aoSoltar(e: Essencia) {
    if (toqueLongoRef.current) clearTimeout(toqueLongoRef.current);
    if (toqueLongoDisparouRef.current) {
      toqueLongoDisparouRef.current = false;
      return; // já disparou como toque longo — não trata como clique
    }
    if (!emEscolhendoAcao || confirmando || estado.reservatorio[e] === 0) return;

    const agora = Date.now();
    const ultimo = ultimoToqueRef.current[e] ?? 0;
    if (agora - ultimo < JANELA_DUPLO_TOQUE_MS) {
      ultimoToqueRef.current[e] = 0;
      tentarColherIguais(e);
      return;
    }
    ultimoToqueRef.current[e] = agora;
    alternar(e);
  }

  function aoCancelar() {
    if (toqueLongoRef.current) clearTimeout(toqueLongoRef.current);
    toqueLongoDisparouRef.current = false;
  }

  return (
    <div className="rounded-lg border border-stone-800 bg-stone-900/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">Reservatório</h3>
        {maximo > 0 && !confirmando && (
          <p className="text-xs text-stone-500">
            toque simples: 3 diferentes · toque longo/duplo: 2 iguais
          </p>
        )}
      </div>

      {/* Bandeja de seleção — Seção 17.6: as fichas tocadas "saltam" para cá. */}
      <div className="mb-2 flex min-h-[52px] items-center gap-2 rounded-lg border border-dashed border-stone-700 bg-stone-950/50 p-2">
        {selecionadas.length === 0 && !confirmando && (
          <span className="text-xs text-stone-600">bandeja de seleção — toque nas fichas abaixo</span>
        )}
        {selecionadas.map((e) => {
          const info = INFO_FICHA[e];
          return (
            <button
              key={e}
              type="button"
              disabled={confirmando}
              onClick={() => alternar(e)}
              className={`flex min-h-[48px] min-w-[48px] flex-col items-center justify-center rounded-lg border-2 border-white ${info.corFundo} ${info.corTexto}`}
              title="Toque para devolver ao reservatório"
            >
              <span className="text-lg">{info.icone}</span>
            </button>
          );
        })}
        {confirmando && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-300">colhendo…</span>
            <button
              type="button"
              onClick={desfazer}
              className="min-h-[48px] rounded-lg bg-red-800 px-3 text-sm font-semibold text-stone-100 active:bg-red-700"
            >
              Desfazer
            </button>
          </div>
        )}
      </div>

      {avisoCadeado && (
        <p className="mb-2 rounded bg-stone-800 px-2 py-1 text-xs text-amber-300">🔒 {avisoCadeado}</p>
      )}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ORDEM_FICHAS.map((f) => {
          const info = INFO_FICHA[f];
          const quantidade = estado.reservatorio[f];

          if (f === 'icor') {
            return (
              <div
                key={f}
                className={`flex min-h-[48px] min-w-[48px] flex-col items-center justify-center rounded-lg border px-2 py-2 ${info.corBorda} ${info.corFundo} ${info.corTexto} opacity-80`}
                title="Ícor não pode ser colhido diretamente — só via Reservar"
              >
                <span className="text-lg">{info.icone}</span>
                <span className="text-sm font-bold">{quantidade}</span>
              </div>
            );
          }

          const essencia = f as Essencia;
          const selecionada = selecionadas.includes(essencia);
          const podeSelecionar =
            emEscolhendoAcao && !confirmando && quantidade > 0 && (selecionada || selecionadas.length < maximo);
          const travada = quantidade > 0 && quantidade < 4;

          return (
            <button
              key={f}
              type="button"
              onPointerDown={() => aoPressionar(essencia)}
              onPointerUp={() => aoSoltar(essencia)}
              onPointerLeave={aoCancelar}
              onPointerCancel={aoCancelar}
              disabled={quantidade === 0}
              className={`relative flex min-h-[48px] min-w-[48px] flex-col items-center justify-center rounded-lg border-2 px-2 py-2 transition ${info.corFundo} ${info.corTexto} ${
                selecionada
                  ? 'border-white ring-2 ring-white'
                  : podeSelecionar
                    ? `${info.corBorda}`
                    : 'border-transparent opacity-40'
              }`}
              aria-label={`${info.rotulo}: ${quantidade} disponíveis${travada ? ', precisa de 4 para colher 2 iguais' : ''}`}
            >
              {travada && <span className="absolute right-1 top-1 text-[10px]">🔒</span>}
              <span className="text-lg">{info.icone}</span>
              <span className="text-sm font-bold">{quantidade}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
