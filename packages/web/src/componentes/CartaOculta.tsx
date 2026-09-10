import { COR_NIVEL } from '../lib/tema.js';

/** Verso de carta — presságio oculto de outro jogador (Seção 16). */
export function CartaOculta({ nivel }: { nivel: 1 | 2 | 3 }) {
  return (
    <div
      className={`flex h-24 w-16 flex-col items-center justify-center rounded-lg border-2 bg-stone-800 text-stone-500 ${COR_NIVEL[nivel]}`}
      title={`Presságio oculto (nível ${nivel})`}
      aria-label={`Presságio oculto, nível ${nivel}`}
    >
      <span className="text-2xl">🂠</span>
      <span className="text-xs">nv.{nivel}</span>
    </div>
  );
}
