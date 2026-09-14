// Seção 7.3/7.4 — as 12 Lendas visíveis. Legalidade de cada botão vem
// diretamente de podeReivindicar/podeReservar; o componente só monta a UI.

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { EstadoVisivel, JogadorOuVisivel } from '@olympos/motor';
import { calcularPagamento, LENDA_POR_ID, podeReivindicar, podeReservar } from '@olympos/motor';
import { NOME_NIVEL } from '../lib/tema.js';
import { useNavegacaoPorSetas } from '../lib/useNavegacaoPorSetas.js';
import { usePartida } from '../loja/usePartida.js';
import { CartaLenda } from './CartaLenda.js';
import { ModalFocoCarta } from './ModalFocoCarta.js';

function BotaoReservarBaralho({
  estadoVisivel,
  nivel,
  jogadorId,
}: {
  estadoVisivel: EstadoVisivel;
  nivel: 1 | 2 | 3;
  jogadorId: string;
}) {
  const despachar = usePartida((s) => s.despachar);
  const pode = podeReservar(estadoVisivel, jogadorId, { tipo: 'baralho', nivel });

  return (
    <button
      type="button"
      disabled={!pode.ok}
      title={pode.ok ? 'Reservar às cegas do topo do baralho (fica oculta para os outros)' : pode.motivo}
      onClick={() => despachar({ tipo: 'RESERVAR', jogadorId, alvo: { tipo: 'baralho', nivel } })}
      className={`mt-1 w-full rounded px-1 py-0.5 text-[10px] font-semibold normal-case ${
        pode.ok
          ? 'bg-stone-700 text-stone-100 hover:bg-stone-600'
          : 'cursor-not-allowed bg-stone-850 text-stone-600'
      }`}
    >
      🂠 reservar às cegas
    </button>
  );
}

function FileiraDeNivel({
  estadoVisivel,
  nivel,
  jogadorFoco,
  aoAbrirFoco,
}: {
  estadoVisivel: EstadoVisivel;
  nivel: 1 | 2 | 3;
  jogadorFoco: JogadorOuVisivel;
  aoAbrirFoco: (cartaId: string) => void;
}) {
  const despachar = usePartida((s) => s.despachar);
  const { containerRef, aoTeclar } = useNavegacaoPorSetas<HTMLDivElement>();

  return (
    <div className="flex items-center gap-2">
      <div className="w-24 shrink-0 text-right text-[10px] uppercase tracking-wide text-stone-500">
        <div className="text-lg font-bold text-stone-400">{nivel}</div>
        {NOME_NIVEL[nivel]}
        <div className="text-stone-600">{estadoVisivel.baralhos[nivel]} no baralho</div>
        <BotaoReservarBaralho estadoVisivel={estadoVisivel} nivel={nivel} jogadorId={jogadorFoco.id} />
      </div>

      <div
        ref={containerRef}
        onKeyDown={aoTeclar}
        role="group"
        aria-label={`Fileira de ${NOME_NIVEL[nivel]}`}
        style={{ perspective: 1000 }}
        className="flex flex-1 flex-wrap gap-2"
      >
        <AnimatePresence mode="popLayout">
          {estadoVisivel.fileiras[nivel].map((cartaId, idx) => {
            if (!cartaId) {
              return (
                <div
                  key={`vazio-${idx}`}
                  className="flex h-40 w-36 items-center justify-center rounded-lg border-2 border-dashed border-stone-800 text-xs text-stone-700"
                >
                  espaço vazio
                </div>
              );
            }

            const lenda = LENDA_POR_ID[cartaId]!;
            const pagamento = calcularPagamento(jogadorFoco, lenda);
            const podeR = podeReivindicar(estadoVisivel, jogadorFoco.id, cartaId, 'fileira');
            const podeS = podeReservar(estadoVisivel, jogadorFoco.id, { tipo: 'fileira', cartaId });

            return (
              <motion.div
                key={cartaId}
                initial={{ opacity: 0, scale: 0.85, rotateY: -90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.3 }}
              >
                <CartaLenda
                  lenda={lenda}
                  pagamento={pagamento}
                  jogadorTemChronos={jogadorFoco.temChronos}
                  aoClicarCard={() => aoAbrirFoco(cartaId)}
                  acoes={[
                    {
                      rotulo: 'Reivindicar',
                      habilitado: podeR.ok,
                      motivo: podeR.ok ? undefined : podeR.motivo,
                      destaque: true,
                      aoClicar: () =>
                        despachar({
                          tipo: 'REIVINDICAR',
                          jogadorId: jogadorFoco.id,
                          cartaId,
                          origem: 'fileira',
                        }),
                    },
                    {
                      rotulo: 'Reservar',
                      habilitado: podeS.ok,
                      motivo: podeS.ok ? undefined : podeS.motivo,
                      aoClicar: () =>
                        despachar({
                          tipo: 'RESERVAR',
                          jogadorId: jogadorFoco.id,
                          alvo: { tipo: 'fileira', cartaId },
                        }),
                    },
                  ]}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

const NIVEIS_DE_CIMA_PARA_BAIXO = [3, 2, 1] as const;

export function FileirasLendas({
  estadoVisivel,
  jogadorFocoId,
}: {
  estadoVisivel: EstadoVisivel;
  /** De quem é a perspectiva de ação — default: quem tem a vez (hotseat local). Online: sempre "eu". */
  jogadorFocoId?: string;
}) {
  const despachar = usePartida((s) => s.despachar);
  const jogadorFoco =
    estadoVisivel.jogadores.find((j) => j.id === jogadorFocoId) ??
    estadoVisivel.jogadores[estadoVisivel.jogadorAtual]!;
  const [cartaFocada, setCartaFocada] = useState<string | null>(null);
  const lendaFocada = cartaFocada ? LENDA_POR_ID[cartaFocada] : null;

  return (
    <div className="flex flex-1 flex-col justify-center gap-3 overflow-y-auto py-2">
      {NIVEIS_DE_CIMA_PARA_BAIXO.map((nivel) => (
        <FileiraDeNivel
          key={nivel}
          estadoVisivel={estadoVisivel}
          nivel={nivel}
          jogadorFoco={jogadorFoco}
          aoAbrirFoco={setCartaFocada}
        />
      ))}

      {lendaFocada && (
        <ModalFocoCarta
          lenda={lendaFocada}
          jogador={jogadorFoco}
          pagamento={calcularPagamento(jogadorFoco, lendaFocada)}
          aoFechar={() => setCartaFocada(null)}
          acoes={[
            {
              rotulo: 'Reivindicar',
              destaque: true,
              habilitado: podeReivindicar(estadoVisivel, jogadorFoco.id, lendaFocada.id, 'fileira').ok,
              motivo: (() => {
                const r = podeReivindicar(estadoVisivel, jogadorFoco.id, lendaFocada.id, 'fileira');
                return r.ok ? undefined : r.motivo;
              })(),
              aoClicar: () => {
                despachar({
                  tipo: 'REIVINDICAR',
                  jogadorId: jogadorFoco.id,
                  cartaId: lendaFocada.id,
                  origem: 'fileira',
                });
                setCartaFocada(null);
              },
            },
            {
              rotulo: 'Reservar',
              habilitado: podeReservar(estadoVisivel, jogadorFoco.id, { tipo: 'fileira', cartaId: lendaFocada.id }).ok,
              motivo: (() => {
                const r = podeReservar(estadoVisivel, jogadorFoco.id, { tipo: 'fileira', cartaId: lendaFocada.id });
                return r.ok ? undefined : r.motivo;
              })(),
              aoClicar: () => {
                despachar({
                  tipo: 'RESERVAR',
                  jogadorId: jogadorFoco.id,
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
