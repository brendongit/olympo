// Seção 17.4 (mobile) — as 3 fileiras com scroll HORIZONTAL e snap por
// carta. As cartas NÃO encolhem para caber na largura da tela: cada uma
// mantém sua largura fixa (a mesma do desktop) e o scroll resolve o resto.
// Tocar numa carta abre o foco (Seção 17.4 item 6 / 17.6) em vez de expor
// botões de ação no card.

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { EstadoVisivel } from '@olympos/motor';
import { calcularPagamento, LENDA_POR_ID, podeReivindicar, podeReservar } from '@olympos/motor';
import { NOME_NIVEL } from '../lib/tema.js';
import { usePartida } from '../loja/usePartida.js';
import { CartaLenda } from './CartaLenda.js';
import { ModalFocoCarta } from './ModalFocoCarta.js';

const NIVEIS_DE_CIMA_PARA_BAIXO = [3, 2, 1] as const;

export function FileirasLendasMobile({
  estadoVisivel,
  jogadorFocoId,
}: {
  estadoVisivel: EstadoVisivel;
  jogadorFocoId?: string;
}) {
  const despachar = usePartida((s) => s.despachar);
  const jogadorDaVez =
    estadoVisivel.jogadores.find((j) => j.id === jogadorFocoId) ??
    estadoVisivel.jogadores[estadoVisivel.jogadorAtual]!;
  const [cartaFocada, setCartaFocada] = useState<string | null>(null);

  const lendaFocada = cartaFocada ? LENDA_POR_ID[cartaFocada] : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto py-2">
      {NIVEIS_DE_CIMA_PARA_BAIXO.map((nivel) => {
        const pode = podeReservar(estadoVisivel, jogadorDaVez.id, { tipo: 'baralho', nivel });
        return (
          <div key={nivel} className="flex items-stretch gap-2">
            <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-stone-800 bg-stone-900/60 py-1 text-center text-[10px] uppercase tracking-wide text-stone-500">
              <div className="text-lg font-bold text-stone-300">{nivel}</div>
              <div className="text-stone-600">{estadoVisivel.baralhos[nivel]} no baralho</div>
              <button
                type="button"
                disabled={!pode.ok}
                title={pode.ok ? 'Reservar às cegas do topo do baralho' : pode.motivo}
                onClick={() =>
                  despachar({ tipo: 'RESERVAR', jogadorId: jogadorDaVez.id, alvo: { tipo: 'baralho', nivel } })
                }
                className={`mt-1 min-h-[32px] w-full rounded px-0.5 text-[9px] font-semibold normal-case ${
                  pode.ok
                    ? 'bg-stone-700 text-stone-100 active:bg-stone-600'
                    : 'cursor-not-allowed bg-stone-850 text-stone-600'
                }`}
              >
                🂠 reservar
              </button>
            </div>

            <div
              className="flex flex-1 snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-2 px-1 pb-1"
              aria-label={`Fileira de ${NOME_NIVEL[nivel]}, role para o lado para ver as 4 cartas`}
              style={{ perspective: 1000 }}
            >
              <AnimatePresence mode="popLayout">
                {estadoVisivel.fileiras[nivel].map((cartaId, idx) => {
                  if (!cartaId) {
                    return (
                      <div
                        key={`vazio-${idx}`}
                        className="flex h-40 w-36 shrink-0 snap-start items-center justify-center rounded-lg border-2 border-dashed border-stone-800 text-xs text-stone-700"
                      >
                        espaço vazio
                      </div>
                    );
                  }

                  const lenda = LENDA_POR_ID[cartaId]!;
                  const pagamento = calcularPagamento(jogadorDaVez, lenda);

                  return (
                    <motion.div
                      key={cartaId}
                      initial={{ opacity: 0, scale: 0.85, rotateY: -90 }}
                      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.3 }}
                      className="shrink-0 snap-start"
                    >
                      <CartaLenda
                        lenda={lenda}
                        pagamento={pagamento}
                        jogadorTemChronos={jogadorDaVez.temChronos}
                        aoClicarCard={() => setCartaFocada(cartaId)}
                        acoes={[]}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        );
      })}

      {lendaFocada && (
        <ModalFocoCarta
          lenda={lendaFocada}
          jogador={jogadorDaVez}
          pagamento={calcularPagamento(jogadorDaVez, lendaFocada)}
          aoFechar={() => setCartaFocada(null)}
          acoes={[
            {
              rotulo: 'Reivindicar',
              destaque: true,
              habilitado: podeReivindicar(estadoVisivel, jogadorDaVez.id, lendaFocada.id, 'fileira').ok,
              motivo: (() => {
                const r = podeReivindicar(estadoVisivel, jogadorDaVez.id, lendaFocada.id, 'fileira');
                return r.ok ? undefined : r.motivo;
              })(),
              aoClicar: () => {
                despachar({
                  tipo: 'REIVINDICAR',
                  jogadorId: jogadorDaVez.id,
                  cartaId: lendaFocada.id,
                  origem: 'fileira',
                });
                setCartaFocada(null);
              },
            },
            {
              rotulo: 'Reservar',
              habilitado: podeReservar(estadoVisivel, jogadorDaVez.id, { tipo: 'fileira', cartaId: lendaFocada.id }).ok,
              motivo: (() => {
                const r = podeReservar(estadoVisivel, jogadorDaVez.id, { tipo: 'fileira', cartaId: lendaFocada.id });
                return r.ok ? undefined : r.motivo;
              })(),
              aoClicar: () => {
                despachar({
                  tipo: 'RESERVAR',
                  jogadorId: jogadorDaVez.id,
                  alvo: { tipo: 'fileira', cartaId: lendaFocada.id },
                });
                setCartaFocada(null);
              },
            },
          ]}
        />
      )}
    </div>
  );
}
