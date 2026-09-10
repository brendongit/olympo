// Seção 17.4 item 3 — painel do jogador como bottom-sheet arrastável.
// Recolhida: Kléos, fichas e presságios. Expandida: Domínios, Lendas por
// Domínio e progresso dos Deuses. Arrasto é só interação — a legalidade de
// qualquer ação continua vindo do motor (podePassar/podeReivindicar).

import { useRef, useState } from 'react';
import type { EstadoJogo } from '@olympos/motor';
import { calcularPagamento, DEUS_POR_ID, LENDA_POR_ID, podePassar, podeReivindicar } from '@olympos/motor';
import { INFO_FICHA, ORDEM_ESSENCIAS, ORDEM_FICHAS } from '../lib/tema.js';
import { usePartida } from '../loja/usePartida.js';
import { ModalFocoCarta } from './ModalFocoCarta.js';

const ALTURA_RECOLHIDA = 168;
const ALTURA_EXPANDIDA_VH = 0.7;

export function PainelJogadorSheet({ estado }: { estado: EstadoJogo }) {
  const despachar = usePartida((s) => s.despachar);
  const jogador = estado.jogadores[estado.jogadorAtual]!;
  const podeP = podePassar(estado, jogador.id);
  const totalFichas = ORDEM_FICHAS.reduce((acc, f) => acc + jogador.fichas[f], 0);

  const [expandido, setExpandido] = useState(false);
  const [alturaArraste, setAlturaArraste] = useState<number | null>(null);
  const [presagioFocado, setPresagioFocado] = useState<string | null>(null);
  const arrastoRef = useRef<{ inicioY: number; alturaInicial: number } | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const alturaExpandidaPx =
    typeof window !== 'undefined' ? Math.round(window.innerHeight * ALTURA_EXPANDIDA_VH) : 400;

  function aoPressionarAlca(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    const alturaAtual = sheetRef.current?.getBoundingClientRect().height ?? ALTURA_RECOLHIDA;
    arrastoRef.current = { inicioY: e.clientY, alturaInicial: alturaAtual };
  }

  function aoArrastarAlca(e: React.PointerEvent) {
    if (!arrastoRef.current) return;
    const delta = e.clientY - arrastoRef.current.inicioY;
    const nova = Math.min(
      alturaExpandidaPx,
      Math.max(ALTURA_RECOLHIDA, arrastoRef.current.alturaInicial - delta),
    );
    setAlturaArraste(nova);
  }

  function aoSoltarAlca() {
    if (!arrastoRef.current) return;
    const meio = (ALTURA_RECOLHIDA + alturaExpandidaPx) / 2;
    setExpandido((alturaArraste ?? ALTURA_RECOLHIDA) > meio);
    setAlturaArraste(null);
    arrastoRef.current = null;
  }

  const lendaFocada = presagioFocado ? LENDA_POR_ID[presagioFocado] : null;

  return (
    <div
      ref={sheetRef}
      className="fixed inset-x-0 bottom-0 z-30 flex flex-col rounded-t-2xl border-t border-stone-800 bg-stone-900 shadow-[0_-4px_16px_rgba(0,0,0,0.4)]"
      style={{
        height: alturaArraste ?? (expandido ? alturaExpandidaPx : ALTURA_RECOLHIDA),
        transition: alturaArraste === null ? 'height 200ms ease-out' : 'none',
      }}
    >
      <div
        onPointerDown={aoPressionarAlca}
        onPointerMove={aoArrastarAlca}
        onPointerUp={aoSoltarAlca}
        onPointerCancel={aoSoltarAlca}
        className="flex shrink-0 cursor-grab touch-none flex-col items-center py-1.5 active:cursor-grabbing"
        role="button"
        tabIndex={0}
        aria-label={expandido ? 'Recolher painel do jogador' : 'Expandir painel do jogador'}
        onClick={() => setExpandido((v) => !v)}
      >
        <span className="h-1.5 w-10 rounded-full bg-stone-700" />
      </div>

      <div className="flex shrink-0 items-center gap-2 px-3 pb-1">
        <span className="text-xl">{jogador.avatar}</span>
        <span className="font-serif text-lg font-bold text-amber-200">{jogador.nome}</span>
        <span className="text-xs text-stone-500">T{estado.numeroDoTurno + 1}</span>
        <span className="ml-auto text-lg font-bold text-amber-300">{jogador.kleos}★</span>
        <button
          type="button"
          disabled={!podeP.ok}
          title={podeP.ok ? 'Nenhuma ação legal disponível — passar o turno' : podeP.motivo}
          onClick={() => despachar({ tipo: 'PASSAR', jogadorId: jogador.id })}
          className={`min-h-[44px] rounded px-3 text-sm font-semibold ${
            podeP.ok
              ? 'bg-red-800 text-stone-100 active:bg-red-700'
              : 'cursor-not-allowed bg-stone-850 text-stone-700'
          }`}
        >
          Passar
        </button>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1.5 px-3 pb-2">
        {ORDEM_FICHAS.map((f) => {
          const info = INFO_FICHA[f];
          return (
            <span
              key={f}
              className={`flex items-center gap-0.5 rounded px-1.5 py-1 text-xs ${info.corFundo} ${info.corTexto}`}
              title={info.rotulo}
            >
              {info.icone}
              {jogador.fichas[f]}
            </span>
          );
        })}
        <span className={`text-xs font-semibold ${totalFichas > 10 ? 'text-red-400' : 'text-stone-400'}`}>
          ({totalFichas}/10)
        </span>

        <span className="ml-2 flex items-center gap-1 text-xs text-stone-500">
          Presságios
          {jogador.pressagios.length === 0 && <span className="text-stone-700">nenhum</span>}
          {jogador.pressagios.map((p) => (
            <button
              key={p.cartaId}
              type="button"
              onClick={() => setPresagioFocado(p.cartaId)}
              className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded border border-stone-700 bg-stone-800 text-sm"
              title={LENDA_POR_ID[p.cartaId]?.nome}
            >
              🂠
            </button>
          ))}
        </span>
      </div>

      {expandido && (
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">Domínios</h3>
          <div className="mb-3 flex flex-wrap gap-2">
            {ORDEM_ESSENCIAS.map((e) => {
              const info = INFO_FICHA[e];
              const qtd = jogador.dominios[e];
              return (
                <span
                  key={e}
                  className="flex items-center gap-1 rounded bg-stone-800 px-2 py-1 text-sm text-stone-200"
                  title={`Domínio ${info.rotulo}`}
                >
                  {info.icone} {qtd}
                </span>
              );
            })}
          </div>

          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
            Lendas reivindicadas ({jogador.lendas.length})
          </h3>
          <div className="mb-3 flex flex-wrap gap-1">
            {jogador.lendas.length === 0 && <span className="text-xs text-stone-600">nenhuma ainda</span>}
            {jogador.lendas.map((id) => {
              const lenda = LENDA_POR_ID[id];
              if (!lenda) return null;
              return (
                <span
                  key={id}
                  className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${INFO_FICHA[lenda.dominio].corFundo} ${INFO_FICHA[lenda.dominio].corTexto}`}
                  title={lenda.nome}
                >
                  {INFO_FICHA[lenda.dominio].icone} {lenda.nome}
                </span>
              );
            })}
          </div>

          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
            Progresso dos Deuses
          </h3>
          <div className="flex flex-col gap-1">
            {estado.deusesDisponiveis.map((id) => {
              const deus = DEUS_POR_ID[id]!;
              const requisitos = ORDEM_ESSENCIAS.filter((e) => deus.requisito[e] > 0);
              const qualificado = requisitos.every((e) => jogador.dominios[e] >= deus.requisito[e]);
              return (
                <div
                  key={id}
                  className={`flex items-center justify-between rounded px-2 py-1 text-xs ${
                    qualificado ? 'bg-amber-400/10 text-amber-300' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  <span className="font-serif font-semibold">{deus.nome}</span>
                  <span className="flex gap-1">
                    {requisitos.map((e) => (
                      <span key={e}>
                        {INFO_FICHA[e].icone}
                        {jogador.dominios[e]}/{deus.requisito[e]}
                      </span>
                    ))}
                  </span>
                </div>
              );
            })}
            {estado.deusesDisponiveis.length === 0 && (
              <p className="text-xs text-stone-600">Todos os Deuses já foram concedidos.</p>
            )}
          </div>
        </div>
      )}

      {lendaFocada && (
        <ModalFocoCarta
          lenda={lendaFocada}
          jogador={jogador}
          pagamento={calcularPagamento(jogador, lendaFocada)}
          reservaOculta={jogador.pressagios.find((p) => p.cartaId === lendaFocada.id)?.oculto}
          aoFechar={() => setPresagioFocado(null)}
          acoes={[
            {
              rotulo: 'Reivindicar',
              destaque: true,
              habilitado: podeReivindicar(estado, jogador.id, lendaFocada.id, 'pressagio').ok,
              motivo: (() => {
                const r = podeReivindicar(estado, jogador.id, lendaFocada.id, 'pressagio');
                return r.ok ? undefined : r.motivo;
              })(),
              aoClicar: () => {
                despachar({
                  tipo: 'REIVINDICAR',
                  jogadorId: jogador.id,
                  cartaId: lendaFocada.id,
                  origem: 'pressagio',
                });
                setPresagioFocado(null);
              },
            },
          ]}
        />
      )}
    </div>
  );
}
