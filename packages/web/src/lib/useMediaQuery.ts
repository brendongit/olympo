// Breakpoints da Seção 17.2. Reage a resize/orientação em tempo real (útil
// para testar em devtools sem precisar recarregar a página).

import { useSyncExternalStore } from 'react';

function subscrever(query: string, ouvir: () => void) {
  const mql = window.matchMedia(query);
  mql.addEventListener('change', ouvir);
  return () => mql.removeEventListener('change', ouvir);
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (ouvir) => subscrever(query, ouvir),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// Seção 17.2: `mobile` é < 640px.
export function useEhMobile(): boolean {
  return useMediaQuery('(max-width: 639.98px)');
}
