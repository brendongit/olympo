import { useEffect, useState } from 'react';
import { TelaConfiguracao } from './componentes/TelaConfiguracao.js';
import { TelaInicio } from './componentes/TelaInicio.js';
import { TelaJogo } from './componentes/TelaJogo.js';
import { TelaSaguao } from './componentes/TelaSaguao.js';
import { usePartida } from './loja/usePartida.js';
import { TelaDespertando } from './rede/TelaDespertando.js';

type Modo = 'inicio' | 'local' | 'online';

function TelaOnline({ aoVoltar }: { aoVoltar: () => void }) {
  const entrarModoOnline = usePartida((s) => s.entrarModoOnline);
  const estadoVisivel = usePartida((s) => s.estadoVisivel);
  const meuJogadorId = usePartida((s) => s.meuJogadorId);

  useEffect(() => {
    entrarModoOnline();
  }, [entrarModoOnline]);

  if (estadoVisivel) {
    return <TelaJogo estadoVisivel={estadoVisivel} jogadorFocoId={meuJogadorId ?? undefined} />;
  }
  return <TelaSaguao aoVoltar={aoVoltar} />;
}

export function App() {
  const [modo, setModo] = useState<Modo>('inicio');
  const estadoLocal = usePartida((s) => s.estadoLocal);
  const estadoVisivelLocal = usePartida((s) => s.estadoVisivel);
  const reiniciar = usePartida((s) => s.reiniciar);

  function voltarAoInicio() {
    reiniciar();
    setModo('inicio');
  }

  if (modo === 'inicio') {
    return (
      <TelaInicio aoEscolherLocal={() => setModo('local')} aoEscolherOnline={() => setModo('online')} />
    );
  }

  if (modo === 'local') {
    if (!estadoLocal || !estadoVisivelLocal) {
      return <TelaConfiguracao aoVoltar={voltarAoInicio} />;
    }
    return <TelaJogo estadoVisivel={estadoVisivelLocal} />;
  }

  return (
    <TelaDespertando>
      <TelaOnline aoVoltar={voltarAoInicio} />
    </TelaDespertando>
  );
}
