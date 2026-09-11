// Seção 20 — aria-live="assertive" em "é a sua vez". Só faz sentido em modo
// online: em hotseat local não existe um "você" único pra anunciar (o
// dispositivo passa de mão em mão, "sua vez" já é óbvio fisicamente).
// Visualmente oculto — é só pra leitor de tela. Limpa o texto pouco depois
// de anunciar: leitores de tela só reanunciam `aria-live` quando o
// conteúdo MUDA, então setar o mesmo texto de novo (ex.: seu turno vem de
// novo depois de uma volta completa) precisa passar por vazio primeiro.

import { useEffect, useState } from 'react';
import { usePartida } from '../loja/usePartida.js';

const DURACAO_TEXTO_MS = 3000;

export function AnuncioSuaVez() {
  const modo = usePartida((s) => s.modo);
  const meuJogadorId = usePartida((s) => s.meuJogadorId);
  const jogadorAtualId = usePartida(
    (s) => s.estadoVisivel?.jogadores[s.estadoVisivel.jogadorAtual]?.id ?? null,
  );
  const [texto, setTexto] = useState('');

  useEffect(() => {
    if (modo !== 'online' || meuJogadorId === null || jogadorAtualId !== meuJogadorId) return;
    setTexto('É a sua vez');
    const id = setTimeout(() => setTexto(''), DURACAO_TEXTO_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jogadorAtualId]);

  if (modo !== 'online') return null;

  return (
    <div aria-live="assertive" className="sr-only">
      {texto}
    </div>
  );
}
