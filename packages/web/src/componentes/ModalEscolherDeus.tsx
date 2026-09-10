// Seção 9 / 17.6 — sub-fase ESCOLHENDO_DEUS: empate entre 2+ Deuses
// elegíveis no mesmo turno. Um toque escolhe; o motor decide o resto.

import type { EstadoJogo } from '@olympos/motor';
import { DEUS_POR_ID, podeEscolherDeus } from '@olympos/motor';
import { INFO_FICHA, ORDEM_ESSENCIAS } from '../lib/tema.js';
import { usePartida } from '../loja/usePartida.js';

export function ModalEscolherDeus({ estado }: { estado: EstadoJogo }) {
  const despachar = usePartida((s) => s.despachar);
  const pendente = estado.escolhaDeusPendente!;
  const jogador = estado.jogadores.find((j) => j.id === pendente.jogadorId)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-amber-600 bg-stone-900 p-6 shadow-2xl">
        <h2 className="mb-1 text-xl font-bold text-amber-300">{jogador.nome}, escolha seu Deus</h2>
        <p className="mb-4 text-sm text-stone-400">
          Você se qualificou para mais de um Deus neste turno (Seção 9). Só é possível receber um por vez —
          o outro continua disponível para turnos futuros.
        </p>

        <div className="flex flex-wrap gap-3">
          {pendente.opcoes.map((deusId) => {
            const deus = DEUS_POR_ID[deusId]!;
            const pode = podeEscolherDeus(estado, jogador.id, deusId);
            return (
              <button
                key={deusId}
                type="button"
                disabled={!pode.ok}
                title={pode.ok ? deus.lenda : pode.motivo}
                onClick={() => despachar({ tipo: 'ESCOLHER_DEUS', jogadorId: jogador.id, deusId })}
                className="flex-1 min-w-[180px] rounded-lg border-2 border-amber-500 bg-stone-800 p-4 text-left transition hover:border-amber-300 hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-serif text-lg font-bold text-stone-100">{deus.nome}</span>
                  <span className="text-amber-300">3★</span>
                </div>
                <p className="mb-2 text-xs italic text-stone-400">{deus.lenda}</p>
                <div className="flex flex-wrap gap-1">
                  {ORDEM_ESSENCIAS.filter((e) => deus.requisito[e] > 0).map((e) => {
                    const info = INFO_FICHA[e];
                    return (
                      <span
                        key={e}
                        className={`flex items-center gap-0.5 rounded px-1 text-xs ${info.corFundo} ${info.corTexto}`}
                      >
                        {info.icone}
                        {deus.requisito[e]}
                      </span>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
