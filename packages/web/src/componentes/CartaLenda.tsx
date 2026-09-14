// Renderização da carta (Seção 17.5). Este componente é "burro": recebe
// resultados já calculados pelo motor (podeReivindicar/podeReservar/
// calcularPagamento) e só decide como desenhar — nenhuma regra é decidida
// aqui.

import { useReducedMotion, useSpring, useTransform, motion, useMotionValue } from 'framer-motion';
import type { Bolsa, Lenda } from '@olympos/motor';
import { COR_NIVEL, estiloAltoContraste, INFO_FICHA, ORDEM_ESSENCIAS } from '../lib/tema.js';
import { usePreferencias } from '../loja/usePreferencias.js';

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
  /** Necessário só para cartas de nível 3, para decidir se a Marca de Chronos pulsa (Seção 19.6). */
  jogadorTemChronos?: boolean;
  /** 'mini' é usado nas pilhas de cartas conquistadas (Domínios) — card reduzido, sem custo/ações. */
  tamanho?: 'completo' | 'mini';
  /** Abre o foco da carta (ModalFocoCarta) ao clicar em qualquer parte do card. Botões de ação não disparam isso. */
  aoClicarCard?: () => void;
}

const SUPORTA_TILT_FINO =
  typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

export function CartaLenda({
  lenda,
  pagamento,
  acoes,
  reservaOculta,
  jogadorTemChronos,
  tamanho = 'completo',
  aoClicarCard,
}: CartaLendaProps) {
  const altoContraste = usePreferencias((s) => s.altoContraste);
  const animacoesReduzidas = usePreferencias((s) => s.animacoesReduzidas);
  const reduzMotionSO = useReducedMotion();
  const mini = tamanho === 'mini';
  const precisaIcor = !!pagamento?.possivel && pagamento.pagamento.icor > 0;
  const reivindicavelDireto = !!pagamento?.possivel && pagamento.pagamento.icor === 0;

  const tiltAtivo = !mini && SUPORTA_TILT_FINO && animacoesReduzidas !== 'sempre' && !reduzMotionSO;
  const ponteiroX = useMotionValue(0.5);
  const ponteiroY = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(ponteiroY, [0, 1], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(ponteiroX, [0, 1], [-8, 8]), { stiffness: 300, damping: 30 });

  function aoMoverPonteiro(ev: React.PointerEvent<HTMLDivElement>) {
    if (!tiltAtivo) return;
    const rect = ev.currentTarget.getBoundingClientRect();
    ponteiroX.set((ev.clientX - rect.left) / rect.width);
    ponteiroY.set((ev.clientY - rect.top) / rect.height);
  }

  function aoSairPonteiro() {
    ponteiroX.set(0.5);
    ponteiroY.set(0.5);
  }

  function aoTeclarCard(ev: React.KeyboardEvent<HTMLDivElement>) {
    if (!aoClicarCard) return;
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      aoClicarCard();
    }
  }

  const borda = reivindicavelDireto
    ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)] animate-pulse motion-reduce:animate-none'
    : precisaIcor
      ? 'border-amber-400'
      : `${COR_NIVEL[lenda.nivel]}`;

  const custosVisiveis = ORDEM_ESSENCIAS.filter((e) => lenda.custo[e] > 0);
  const concedeChronos = lenda.chronos && !jogadorTemChronos;

  // Seção 20: aria-label completo — nome/nível/domínio/kléos/argo/chronos +
  // custo por extenso + estado de cada ação, pra não depender só do visual.
  const custoFalado =
    custosVisiveis.length === 0
      ? 'grátis'
      : `custo ${custosVisiveis
          .map((e) => `${lenda.custo[e]} ${INFO_FICHA[e].rotulo}`)
          .join(', ')
          .replace(/, ([^,]*)$/, ' e $1')}`;
  const estadosFalados = acoes
    .map((a) => `${a.habilitado ? 'Você pode' : 'Não é possível'} ${a.rotulo.toLowerCase()}${!a.habilitado && a.motivo ? ` (${a.motivo})` : ''}`)
    .join('. ');

  return (
    <div style={tiltAtivo ? { perspective: 800 } : undefined}>
      <motion.div
        layoutId={`carta-${lenda.id}`}
        onPointerMove={aoMoverPonteiro}
        onPointerLeave={aoSairPonteiro}
        onClick={aoClicarCard}
        onKeyDown={aoClicarCard ? aoTeclarCard : undefined}
        tabIndex={aoClicarCard ? 0 : undefined}
        style={tiltAtivo ? { rotateX, rotateY } : undefined}
        className={`flex flex-col rounded-lg border-2 bg-stone-900 text-stone-100 ${
          mini ? 'w-14 gap-0.5 p-1' : 'w-36 p-2'
        } ${aoClicarCard ? 'cursor-pointer' : ''} ${borda}`}
        aria-label={`${lenda.nome}, nível ${lenda.nivel}, domínio ${INFO_FICHA[lenda.dominio].rotulo}, ${lenda.kleos} Kléos${
          lenda.argo > 0 ? `, ${lenda.argo} símbolo${lenda.argo > 1 ? 's' : ''} do Argo` : ''
        }${concedeChronos ? ', concede a Essência de Chronos' : ''}, ${custoFalado}${estadosFalados ? `. ${estadosFalados}` : ''}`}
      >
        <div className={`flex items-center justify-between font-bold ${mini ? 'text-[9px]' : 'mb-1 text-sm'}`}>
          <span title="Kléos">{lenda.kleos > 0 ? `${lenda.kleos}★` : '—'}</span>
          {lenda.argo > 0 && (
            <span className="text-stone-300" title={`${lenda.argo} símbolo(s) do Argo`}>
              {'⛵'.repeat(lenda.argo)}
            </span>
          )}
          <span
            className={`flex items-center justify-center rounded-full ${INFO_FICHA[lenda.dominio].corFundo} ${INFO_FICHA[lenda.dominio].corTexto} ${
              mini ? 'h-3.5 w-3.5 text-[8px]' : 'h-5 w-5 text-xs'
            }`}
            style={estiloAltoContraste(lenda.dominio, altoContraste)}
            title={`Domínio: ${INFO_FICHA[lenda.dominio].rotulo}`}
          >
            {INFO_FICHA[lenda.dominio].icone}
          </span>
        </div>

        {lenda.chronos && (
          <div className={`flex justify-end ${mini ? '' : 'mb-1'}`}>
            <span
              className={`text-xs ${concedeChronos ? 'text-amber-300 animate-pulse motion-reduce:animate-none' : 'text-stone-700'}`}
              title={concedeChronos ? 'Concede a Essência de Chronos' : 'Marca de Chronos — você já tem a Essência'}
            >
              ⧗
            </span>
          </div>
        )}

        <div
          className={`truncate text-center font-serif font-semibold ${mini ? 'text-[9px]' : 'mb-1 text-sm'}`}
          title={lenda.nome}
        >
          {reservaOculta ? '🂠 (só você vê)' : lenda.nome}
        </div>

        {!mini && (
          <div className="mb-2 flex flex-wrap justify-center gap-1 border-t border-stone-700 pt-1">
            {custosVisiveis.length === 0 ? (
              <span className="text-xs text-stone-500">grátis</span>
            ) : (
              custosVisiveis.map((e) => (
                <span
                  key={e}
                  className={`flex items-center gap-0.5 rounded px-1 text-xs ${INFO_FICHA[e].corFundo} ${INFO_FICHA[e].corTexto}`}
                  style={estiloAltoContraste(e, altoContraste)}
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
        )}

        {!mini && acoes.length > 0 && (
          <div className="mt-auto flex flex-col gap-1">
            {acoes.map((a) => (
              <button
                key={a.rotulo}
                type="button"
                disabled={!a.habilitado}
                title={a.motivo}
                onClick={(ev) => {
                  ev.stopPropagation();
                  a.aoClicar();
                }}
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
      </motion.div>
    </div>
  );
}
