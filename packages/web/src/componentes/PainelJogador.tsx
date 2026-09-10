// Painel fixo do jogador da vez (Seção 17.3/17.8). Presságios próprios são
// sempre visíveis para o dono — não precisa de projeção aqui.

import type { EstadoJogo } from '@olympos/motor';
import { calcularPagamento, LENDA_POR_ID, podePassar, podeReivindicar } from '@olympos/motor';
import { INFO_FICHA, ORDEM_FICHAS } from '../lib/tema.js';
import { usePartida } from '../loja/usePartida.js';
import { CartaLenda } from './CartaLenda.js';

export function PainelJogador({ estado }: { estado: EstadoJogo }) {
  const despachar = usePartida((s) => s.despachar);
  const jogador = estado.jogadores[estado.jogadorAtual]!;
  const totalFichas = ORDEM_FICHAS.reduce((acc, f) => acc + jogador.fichas[f], 0);
  const podeP = podePassar(estado, jogador.id);

  return (
    <div className="flex flex-col gap-3 border-t border-stone-800 bg-stone-900 p-3 md:flex-row md:items-start md:justify-between">
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-2xl">{jogador.avatar}</span>
          <span className="font-serif text-xl font-bold text-amber-200">{jogador.nome}</span>
          <span className="text-sm text-stone-400">· Turno {estado.numeroDoTurno + 1}</span>
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

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-stone-500">Domínios</span>
          {ORDEM_FICHAS.filter((f) => f !== 'icor').map((f) => {
            const info = INFO_FICHA[f];
            const qtd = jogador.dominios[f as keyof typeof jogador.dominios];
            return (
              <span
                key={f}
                className="flex items-center gap-0.5 rounded bg-stone-800 px-1.5 py-0.5 text-xs text-stone-300"
                title={`Domínio ${info.rotulo}`}
              >
                {info.icone}
                {qtd}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide text-stone-500">
          Seus presságios ({jogador.pressagios.length}/3)
        </span>
        <div className="flex gap-2">
          {jogador.pressagios.map((p) => {
            const lenda = LENDA_POR_ID[p.cartaId]!;
            const pagamento = calcularPagamento(jogador, lenda);
            const podeR = podeReivindicar(estado, jogador.id, p.cartaId, 'pressagio');
            return (
              <CartaLenda
                key={p.cartaId}
                lenda={lenda}
                pagamento={pagamento}
                reservaOculta={p.oculto}
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
                        cartaId: p.cartaId,
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
    </div>
  );
}
