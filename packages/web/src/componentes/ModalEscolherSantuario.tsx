// Seção 10 / 17.6 — sub-fase ESCOLHENDO_SANTUARIO: 2+ Santuários elegíveis
// no mesmo turno. Um toque escolhe; o motor decide o resto.

import type { EstadoVisivel } from '@olympos/motor';
import { podeEscolherSantuario, SANTUARIO_POR_ID } from '@olympos/motor';
import { INFO_FICHA, ORDEM_ESSENCIAS } from '../lib/tema.js';
import { usePartida } from '../loja/usePartida.js';

export function ModalEscolherSantuario({ estadoVisivel }: { estadoVisivel: EstadoVisivel }) {
  const despachar = usePartida((s) => s.despachar);
  const pendente = estadoVisivel.escolhaSantuarioPendente!;
  const jogador = estadoVisivel.jogadores.find((j) => j.id === pendente.jogadorId)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-amber-600 bg-stone-900 p-6 shadow-2xl">
        <h2 className="mb-1 text-xl font-bold text-amber-300">{jogador.nome}, escolha seu Santuário</h2>
        <p className="mb-4 text-sm text-stone-400">
          Você se qualificou para mais de um Santuário neste turno (Seção 10). Só é possível receber um por vez —
          o outro continua disponível para turnos futuros.
        </p>

        <div className="flex flex-wrap gap-3">
          {pendente.opcoes.map((santuarioId) => {
            const santuario = SANTUARIO_POR_ID[santuarioId]!;
            const pode = podeEscolherSantuario(estadoVisivel, jogador.id, santuarioId);
            return (
              <button
                key={santuarioId}
                type="button"
                disabled={!pode.ok}
                title={pode.ok ? `Patrono: ${santuario.patrono}` : pode.motivo}
                onClick={() => despachar({ tipo: 'ESCOLHER_SANTUARIO', jogadorId: jogador.id, santuarioId })}
                className="flex-1 min-w-[180px] rounded-lg border-2 border-amber-500 bg-stone-800 p-4 text-left transition hover:border-amber-300 hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-serif text-lg font-bold text-stone-100">{santuario.nome}</span>
                  <span className="text-amber-300">3★</span>
                </div>
                <p className="mb-2 text-xs italic text-stone-400">Patrono: {santuario.patrono}</p>
                <div className="flex flex-wrap gap-1">
                  {ORDEM_ESSENCIAS.filter((e) => santuario.requisito[e] > 0).map((e) => {
                    const info = INFO_FICHA[e];
                    return (
                      <span
                        key={e}
                        className={`flex items-center gap-0.5 rounded px-1 text-xs ${info.corFundo} ${info.corTexto}`}
                      >
                        {info.icone}
                        {santuario.requisito[e]}
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
