import { TelaConfiguracao } from './componentes/TelaConfiguracao.js';
import { TelaJogo } from './componentes/TelaJogo.js';
import { usePartida } from './loja/usePartida.js';

export function App() {
  const estado = usePartida((s) => s.estado);

  if (!estado) return <TelaConfiguracao />;
  return <TelaJogo estado={estado} />;
}
