// Seção 17.4 item 6 / 17.6 — "Foco de carta": no mobile, tocar numa carta
// (fileira ou presságio) abre este modal em vez de expor botões diretamente
// no card apertado. O custo decomposto e a legalidade das ações continuam
// vindo só do motor (calcularPagamento/podeReivindicar/podeReservar); este
// componente apenas formata o texto.

import type { Bolsa, JogadorOuVisivel, Lenda } from '@olympos/motor';
import { useFecharComEsc } from '../lib/useFecharComEsc.js';
import { INFO_FICHA, ORDEM_ESSENCIAS } from '../lib/tema.js';
import type { AcaoCarta } from './CartaLenda.js';

interface ModalFocoCartaProps {
  lenda: Lenda;
  /** Omitido para cartas já conquistadas (Domínios) — não há custo a decompor nem ações. */
  jogador?: JogadorOuVisivel;
  pagamento?: { possivel: boolean; pagamento: Bolsa };
  acoes?: AcaoCarta[];
  reservaOculta?: boolean;
  aoFechar: () => void;
}

export function ModalFocoCarta({
  lenda,
  jogador,
  pagamento,
  acoes = [],
  reservaOculta,
  aoFechar,
}: ModalFocoCartaProps) {
  useFecharComEsc(aoFechar);
  const custosVisiveis = ORDEM_ESSENCIAS.filter((e) => lenda.custo[e] > 0);
  const concedeChronos = lenda.chronos && !!jogador && !jogador.temChronos;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={aoFechar}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-stone-700 bg-stone-900 p-4 shadow-2xl"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-bold text-amber-300">{lenda.kleos > 0 ? `${lenda.kleos}★` : 'sem Kléos'}</span>
          {lenda.argo > 0 && (
            <span className="text-sm text-stone-300" title={`${lenda.argo} símbolo(s) do Argo`}>
              {'⛵'.repeat(lenda.argo)}
            </span>
          )}
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-base ${INFO_FICHA[lenda.dominio].corFundo} ${INFO_FICHA[lenda.dominio].corTexto}`}
            title={`Domínio: ${INFO_FICHA[lenda.dominio].rotulo}`}
          >
            {INFO_FICHA[lenda.dominio].icone}
          </span>
        </div>

        {lenda.chronos && (
          <p
            className={`mb-2 text-right text-xs font-semibold ${concedeChronos ? 'text-amber-300' : 'text-stone-600'}`}
          >
            ⧗ {concedeChronos ? 'Concede a Essência de Chronos' : 'Marca de Chronos — você já tem a Essência'}
          </p>
        )}

        <h2 className="mb-3 text-center font-serif text-2xl font-bold text-stone-100">
          {reservaOculta ? '🂠 Presságio oculto' : lenda.nome}
        </h2>

        {jogador && pagamento ? (
          <div className="mb-4 rounded-lg border border-stone-800 bg-stone-950/60 p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
              Custo decomposto
            </h3>
            {custosVisiveis.length === 0 ? (
              <p className="text-sm text-stone-300">Grátis — nenhuma essência necessária.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {custosVisiveis.map((e) => {
                  const info = INFO_FICHA[e];
                  const total = lenda.custo[e];
                  const coberto = Math.min(total, jogador.dominios[e]);
                  const restante = total - coberto;
                  return (
                    <li key={e} className="flex items-center gap-1 text-sm text-stone-200">
                      <span className={`flex items-center gap-0.5 rounded px-1 ${info.corFundo} ${info.corTexto}`}>
                        {info.icone}
                        {total}
                      </span>
                      {coberto > 0 && (
                        <span className="text-stone-400">
                          − {coberto} domínio = <span className="font-semibold text-stone-100">{restante}</span> a
                          pagar
                        </span>
                      )}
                      {coberto === 0 && <span className="text-stone-400">a pagar</span>}
                    </li>
                  );
                })}
                {pagamento.pagamento.icor > 0 && (
                  <li className="flex items-center gap-1 text-sm text-yellow-300">
                    <span className="flex items-center gap-0.5 rounded bg-yellow-400 px-1 text-amber-950">
                      💧{pagamento.pagamento.icor}
                    </span>
                    Ícor necessário para completar o pagamento
                  </li>
                )}
              </ul>
            )}
          </div>
        ) : (
          <p className="mb-4 text-center text-sm text-stone-500">Já conquistada — concede Domínio permanente.</p>
        )}

        <div className="flex flex-col gap-2">
          {acoes.map((a) => (
            <div key={a.rotulo}>
              <button
                type="button"
                disabled={!a.habilitado}
                onClick={a.aoClicar}
                className={`min-h-[48px] w-full rounded-lg text-base font-semibold transition ${
                  a.habilitado
                    ? a.destaque
                      ? 'bg-amber-500 text-stone-950 active:bg-amber-400'
                      : 'bg-stone-700 text-stone-100 active:bg-stone-600'
                    : 'cursor-not-allowed bg-stone-800 text-stone-600'
                }`}
              >
                {a.rotulo}
              </button>
              {!a.habilitado && a.motivo && (
                <p className="mt-1 text-center text-xs text-stone-500">{a.motivo}</p>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={aoFechar}
            className="min-h-[48px] w-full rounded-lg bg-stone-800 text-sm font-semibold text-stone-300 active:bg-stone-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
