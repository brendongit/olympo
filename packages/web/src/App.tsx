import { useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { TelaConfiguracao } from './componentes/TelaConfiguracao.js';
import { TelaInicio } from './componentes/TelaInicio.js';
import { TelaJogo } from './componentes/TelaJogo.js';
import { TelaSaguao } from './componentes/TelaSaguao.js';
import { usePartida } from './loja/usePartida.js';
import { usePreferencias } from './loja/usePreferencias.js';
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
  const animacoesReduzidas = usePreferencias((s) => s.animacoesReduzidas);
  const estadoLocal = usePartida((s) => s.estadoLocal);
  const estadoVisivelLocal = usePartida((s) => s.estadoVisivel);
  const reiniciar = usePartida((s) => s.reiniciar);

  function voltarAoInicio() {
    reiniciar();
    setModo('inicio');
  }

  let conteudo: React.ReactNode;
  if (modo === 'inicio') {
    conteudo = (
      <TelaInicio aoEscolherLocal={() => setModo('local')} aoEscolherOnline={() => setModo('online')} />
    );
  } else if (modo === 'local') {
    conteudo =
      !estadoLocal || !estadoVisivelLocal ? (
        <TelaConfiguracao aoVoltar={voltarAoInicio} />
      ) : (
        <TelaJogo estadoVisivel={estadoVisivelLocal} />
      );
  } else {
    conteudo = (
      <TelaDespertando>
        <TelaOnline aoVoltar={voltarAoInicio} />
      </TelaDespertando>
    );
  }

  // Seção 19.8 — "user" respeita prefers-reduced-motion do sistema
  // automaticamente (mecanismo embutido do Framer Motion); o toggle manual
  // de "Animações reduzidas" (PainelPreferencias) força "always".
  return (
    <MotionConfig reducedMotion={animacoesReduzidas === 'sempre' ? 'always' : 'user'}>{conteudo}</MotionConfig>
  );
}
