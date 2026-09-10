// Acordeão colapsado dos Santuários (Seção 10), mostrando o progresso de
// qualificação do jogador da vez. Expande para o mesmo conteúdo do
// PainelSantuarios do desktop; a legalidade de quem qualifica continua vindo
// do motor (é só leitura de dominios/requisito, igual ao componente desktop).

import { useState } from 'react';
import type { EstadoJogo } from '@olympos/motor';
import { SANTUARIO_POR_ID } from '@olympos/motor';
import { PainelSantuarios } from './PainelSantuarios.js';

export function AcordeaoSantuarios({ estado }: { estado: EstadoJogo }) {
  const [aberto, setAberto] = useState(false);
  const jogadorDaVez = estado.jogadores[estado.jogadorAtual]!;

  const qualificados = estado.santuariosDisponiveis.filter((id) => {
    const santuario = SANTUARIO_POR_ID[id]!;
    return (Object.keys(santuario.requisito) as (keyof typeof santuario.requisito)[])
      .filter((e) => santuario.requisito[e] > 0)
      .every((e) => jogadorDaVez.dominios[e] >= santuario.requisito[e]);
  }).length;

  return (
    <div className="border-b border-stone-800 bg-stone-900">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex min-h-[44px] w-full items-center gap-2 px-3 py-2 text-left active:bg-stone-800"
      >
        <span className="text-base">⛩</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-300">Santuários</span>
        <span className="text-xs text-stone-500">
          {qualificados}/{estado.santuariosDisponiveis.length} qualificados
        </span>
        <span className="ml-auto text-stone-500">{aberto ? '▾' : '▸'}</span>
      </button>
      {aberto && (
        <div className="border-t border-stone-800 px-3 py-2">
          <PainelSantuarios estado={estado} mostrarTitulo={false} />
        </div>
      )}
    </div>
  );
}
