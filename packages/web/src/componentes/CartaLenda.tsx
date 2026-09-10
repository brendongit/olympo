// Renderização da carta (Seção 17.5). Este componente é "burro": recebe
// resultados já calculados pelo motor (podeReivindicar/podeReservar/
// calcularPagamento) e só decide como desenhar — nenhuma regra é decidida
// aqui.

import type { Bolsa, Lenda } from '@olympos/motor';
import { COR_NIVEL, INFO_FICHA, ORDEM_ESSENCIAS } from '../lib/tema.js';

export interface AcaoCarta {
  rotulo: string;
  habilitado: boolean;
  motivo?: string;
  aoClicar: () => void;
  destaque?: boolean;
}

interface CartaLendaProps {
  lenda: Lenda;
  /** Resultado de calcularPagamento(jogadorDaVez, lenda) — omitido quando não é a vez de ninguém interagir. */
  pagamento?: { possivel: boolean; pagamento: Bolsa } | undefined;
  acoes: AcaoCarta[];
  reservaOculta?: boolean; // presságio próprio ainda oculto para os outros — só um lembrete visual
}

export function CartaLenda({ lenda, pagamento, acoes, reservaOculta }: CartaLendaProps) {
  const precisaIcor = !!pagamento?.possivel && pagamento.pagamento.icor > 0;
  const reivindicavelDireto = !!pagamento?.possivel && pagamento.pagamento.icor === 0;

  const borda = reivindicavelDireto
    ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)] animate-pulse'
    : precisaIcor
      ? 'border-amber-400'
      : `${COR_NIVEL[lenda.nivel]}`;

  const custosVisiveis = ORDEM_ESSENCIAS.filter((e) => lenda.custo[e] > 0);

  return (
    <div
      className={`flex w-36 flex-col rounded-lg border-2 bg-stone-900 p-2 text-stone-100 ${borda}`}
      aria-label={`${lenda.nome}, nível ${lenda.nivel}, domínio ${INFO_FICHA[lenda.dominio].rotulo}, ${lenda.kleos} Kléos`}
    >
      <div className="mb-1 flex items-center justify-between text-sm font-bold">
        <span title="Kléos">{lenda.kleos > 0 ? `${lenda.kleos}★` : '—'}</span>
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${INFO_FICHA[lenda.dominio].corFundo} ${INFO_FICHA[lenda.dominio].corTexto}`}
          title={`Domínio: ${INFO_FICHA[lenda.dominio].rotulo}`}
        >
          {INFO_FICHA[lenda.dominio].icone}
        </span>
      </div>

      <div className="mb-1 truncate text-center text-sm font-serif font-semibold" title={lenda.nome}>
        {reservaOculta ? '🂠 (só você vê)' : lenda.nome}
      </div>

      <div className="mb-2 flex flex-wrap justify-center gap-1 border-t border-stone-700 pt-1">
        {custosVisiveis.length === 0 ? (
          <span className="text-xs text-stone-500">grátis</span>
        ) : (
          custosVisiveis.map((e) => (
            <span
              key={e}
              className={`flex items-center gap-0.5 rounded px-1 text-xs ${INFO_FICHA[e].corFundo} ${INFO_FICHA[e].corTexto}`}
              title={INFO_FICHA[e].rotulo}
            >
              {INFO_FICHA[e].icone}
              {lenda.custo[e]}
            </span>
          ))
        )}
        {precisaIcor && (
          <span
            className="flex items-center gap-0.5 rounded bg-yellow-400 px-1 text-xs text-amber-950"
            title="Vai precisar de Ícor para completar o pagamento"
          >
            💧{pagamento!.pagamento.icor}
          </span>
        )}
      </div>

      {acoes.length > 0 && (
        <div className="mt-auto flex flex-col gap-1">
          {acoes.map((a) => (
            <button
              key={a.rotulo}
              type="button"
              disabled={!a.habilitado}
              title={a.motivo}
              onClick={a.aoClicar}
              className={`rounded px-2 py-1 text-xs font-semibold transition ${
                a.habilitado
                  ? a.destaque
                    ? 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                    : 'bg-stone-700 text-stone-100 hover:bg-stone-600'
                  : 'cursor-not-allowed bg-stone-800 text-stone-600'
              }`}
            >
              {a.rotulo}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
