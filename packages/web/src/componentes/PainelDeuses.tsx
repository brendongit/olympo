// Seção 9 — Favor Divino. Só exibição: quem concede o quê é decidido pelo
// motor dentro de finalizarTurno; aqui só lemos deusesDisponiveis/domínios.

import type { EstadoJogo } from '@olympos/motor';
import { DEUS_POR_ID } from '@olympos/motor';
import { INFO_FICHA, ORDEM_ESSENCIAS } from '../lib/tema.js';

export function PainelDeuses({
  estado,
  mostrarTitulo = true,
}: {
  estado: EstadoJogo;
  mostrarTitulo?: boolean;
}) {
  const jogadorDaVez = estado.jogadores[estado.jogadorAtual]!;

  return (
    <div className="flex w-full flex-col gap-2 overflow-y-auto">
      {mostrarTitulo && (
        <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400">Deuses</h2>
      )}
      {estado.deusesDisponiveis.map((id) => {
        const deus = DEUS_POR_ID[id]!;
        const requisitos = ORDEM_ESSENCIAS.filter((e) => deus.requisito[e] > 0);
        const qualificado = requisitos.every((e) => jogadorDaVez.dominios[e] >= deus.requisito[e]);

        return (
          <div
            key={id}
            className={`rounded-lg border p-2 ${
              qualificado ? 'border-amber-400 bg-amber-400/10' : 'border-stone-800 bg-stone-900/60'
            }`}
            title={deus.lenda}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="font-serif text-sm font-semibold text-stone-100">{deus.nome}</span>
              <span className="text-xs text-amber-300">3★</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {requisitos.map((e) => {
                const info = INFO_FICHA[e];
                const atingido = jogadorDaVez.dominios[e] >= deus.requisito[e];
                return (
                  <span
                    key={e}
                    className={`flex items-center gap-0.5 rounded px-1 text-xs ${
                      atingido ? `${info.corFundo} ${info.corTexto}` : 'bg-stone-800 text-stone-400'
                    }`}
                    title={`${info.rotulo}: ${jogadorDaVez.dominios[e]}/${deus.requisito[e]}`}
                  >
                    {info.icone}
                    {jogadorDaVez.dominios[e]}/{deus.requisito[e]}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
      {estado.deusesDisponiveis.length === 0 && (
        <p className="text-xs text-stone-500">Todos os Deuses já foram concedidos.</p>
      )}
    </div>
  );
}
