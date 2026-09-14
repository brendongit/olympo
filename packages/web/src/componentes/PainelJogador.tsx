// Painel fixo do jogador em foco (Seção 17.3/17.8). Em hotseat local, é
// sempre quem tem a vez (o dispositivo passa de mão em mão); online, é
// sempre "eu" — por isso `jogadorFocoId` é explícito e nunca assume
// jogadorAtual sozinho. Presságios do dono do painel nunca vêm redigidos
// pela projeção (Seção 18), então `cartaId` é sempre real aqui.

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { EstadoVisivel } from '@olympos/motor';
import { calcularPagamento, LENDA_POR_ID, podePassar, podeReivindicar } from '@olympos/motor';
import { INFO_FICHA, ORDEM_ESSENCIAS, ORDEM_FICHAS } from '../lib/tema.js';
import { usePartida } from '../loja/usePartida.js';
import { CartaLenda } from './CartaLenda.js';
import { ModalFocoCarta } from './ModalFocoCarta.js';

export function PainelJogador({
  estadoVisivel,
  jogadorFocoId,
}: {
  estadoVisivel: EstadoVisivel;
  jogadorFocoId?: string;
}) {
  const despachar = usePartida((s) => s.despachar);
  const jogador =
    estadoVisivel.jogadores.find((j) => j.id === jogadorFocoId) ??
    estadoVisivel.jogadores[estadoVisivel.jogadorAtual]!;
  const totalFichas = ORDEM_FICHAS.reduce((acc, f) => acc + jogador.fichas[f], 0);
  const podeP = podePassar(estadoVisivel, jogador.id);
  const [cartaFocada, setCartaFocada] = useState<string | null>(null);
  const lendaFocada = cartaFocada ? LENDA_POR_ID[cartaFocada] : null;
  const pilhasDeLendas = ORDEM_ESSENCIAS.map((essencia) => ({
    essencia,
    cartas: jogador.lendas.filter((id) => LENDA_POR_ID[id]?.dominio === essencia),
  })).filter((pilha) => pilha.cartas.length > 0);

  return (
    <div className="flex flex-col gap-3 border-t border-stone-800 bg-stone-900 p-3 md:flex-row md:items-start md:justify-between">
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-2xl">{jogador.avatar}</span>
          <span className="font-serif text-xl font-bold text-amber-200">{jogador.nome}</span>
          <span className="text-sm text-stone-400">· Turno {estadoVisivel.numeroDoTurno + 1}</span>
          <span className="text-xs text-stone-400" title={`${jogador.simbolosArgo} símbolo(s) do Argo`}>
            ⛵{jogador.simbolosArgo}
          </span>
          <span
            className={`text-xs ${jogador.temChronos ? 'text-stone-200' : 'text-stone-600'}`}
            title={jogador.temChronos ? 'Tem a Essência de Chronos' : 'Sem a Essência de Chronos'}
          >
            ⧗{jogador.temChronos ? '✓' : '✗'}
          </span>
          {estadoVisivel.argonautas.dono === jogador.id && (
            <motion.span
              layoutId="argonautas-coroa"
              className="text-xs text-amber-400"
              title="Você está com Os Argonautas"
            >
              👑
            </motion.span>
          )}
          {jogador.santuarios.length > 0 && (
            <span className="text-xs text-amber-400">⛩ ×{jogador.santuarios.length}</span>
          )}
          <span className="ml-auto text-lg font-bold text-amber-300">{jogador.kleos}★</span>
        </div>

        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-stone-500">Fichas</span>
          {ORDEM_FICHAS.map((f) => {
            const info = INFO_FICHA[f];
            return (
              <span
                key={f}
                className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs ${info.corFundo} ${info.corTexto}`}
                title={info.rotulo}
              >
                {info.icone}
                {jogador.fichas[f]}
              </span>
            );
          })}
          <span
            className={`text-xs font-semibold ${totalFichas > 10 ? 'text-red-400' : 'text-stone-400'}`}
          >
            ({totalFichas}/10)
          </span>
        </div>

        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-stone-500">Domínios</span>
          {ORDEM_ESSENCIAS.map((e) => {
            const info = INFO_FICHA[e];
            return (
              <span
                key={e}
                className="flex items-center gap-0.5 rounded bg-stone-800 px-1.5 py-0.5 text-xs text-stone-300"
                title={`Domínio ${info.rotulo}`}
              >
                {info.icone}
                {jogador.dominios[e]}
              </span>
            );
          })}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <span className="text-xs uppercase tracking-wide text-stone-500">
            Lendas ({jogador.lendas.length})
          </span>
          {jogador.lendas.length === 0 && <span className="text-xs text-stone-600">nenhuma ainda</span>}
          {pilhasDeLendas.map(({ essencia, cartas }) => (
            <div
              key={essencia}
              className="relative flex items-center"
              style={{ width: 56 + (cartas.length - 1) * 22, height: 78 }}
              title={`${INFO_FICHA[essencia].rotulo} ×${cartas.length}`}
            >
              <AnimatePresence>
                {cartas.map((id, i) => {
                  const lenda = LENDA_POR_ID[id];
                  if (!lenda) return null;
                  const ultima = i === cartas.length - 1;
                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className="absolute top-0"
                      style={{ left: i * 22, zIndex: i }}
                    >
                      <CartaLenda
                        lenda={lenda}
                        tamanho="mini"
                        acoes={[]}
                        aoClicarCard={ultima ? () => setCartaFocada(id) : undefined}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide text-stone-500">
          Seus presságios ({jogador.pressagios.length}/3)
        </span>
        <div className="flex gap-2">
          {jogador.pressagios.map((p) => {
            // `p.cartaId` nunca é null aqui: esta é sempre a projeção do
            // próprio dono do painel, e presságios próprios nunca são
            // redigidos (Seção 18).
            const cartaId = p.cartaId!;
            const lenda = LENDA_POR_ID[cartaId]!;
            const pagamento = calcularPagamento(jogador, lenda);
            const podeR = podeReivindicar(estadoVisivel, jogador.id, cartaId, 'pressagio');
            return (
              <CartaLenda
                key={cartaId}
                lenda={lenda}
                pagamento={pagamento}
                reservaOculta={p.oculto}
                jogadorTemChronos={jogador.temChronos}
                acoes={[
                  {
                    rotulo: 'Reivindicar',
                    habilitado: podeR.ok,
                    motivo: podeR.ok ? undefined : podeR.motivo,
                    destaque: true,
                    aoClicar: () =>
                      despachar({
                        tipo: 'REIVINDICAR',
                        jogadorId: jogador.id,
                        cartaId,
                        origem: 'pressagio',
                      }),
                  },
                ]}
              />
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={!podeP.ok}
        title={podeP.ok ? 'Nenhuma ação legal disponível — passar o turno' : podeP.motivo}
        onClick={() => despachar({ tipo: 'PASSAR', jogadorId: jogador.id })}
        className={`self-start rounded px-3 py-2 text-sm font-semibold ${
          podeP.ok
            ? 'bg-red-800 text-stone-100 hover:bg-red-700'
            : 'cursor-not-allowed bg-stone-850 text-stone-700'
        }`}
      >
        Passar
      </button>

      {lendaFocada && <ModalFocoCarta lenda={lendaFocada} aoFechar={() => setCartaFocada(null)} />}
    </div>
  );
}
