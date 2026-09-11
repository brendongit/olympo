export function TelaInicio({
  aoEscolherLocal,
  aoEscolherOnline,
}: {
  aoEscolherLocal: () => void;
  aoEscolherOnline: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-950 p-6">
      <div className="w-full max-w-md rounded-xl border border-stone-800 bg-stone-900 p-8 shadow-xl">
        <h1 className="mb-1 text-center text-3xl font-serif font-bold tracking-wide text-amber-200">OLYMPOS</h1>
        <p className="mb-8 text-center text-sm text-stone-400">Reskin mitológico de Splendor: Marvel</p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={aoEscolherLocal}
            className="w-full rounded-lg bg-amber-500 py-3 font-semibold text-stone-950 transition hover:bg-amber-400"
          >
            Jogar no mesmo aparelho
          </button>
          <button
            type="button"
            onClick={aoEscolherOnline}
            className="w-full rounded-lg border border-stone-700 py-3 font-semibold text-stone-200 transition hover:border-stone-500"
          >
            Jogar online
          </button>
        </div>
      </div>
    </div>
  );
}
