// Tela de despertar — Seção 17.7 (deploy no Render, plano gratuito).
//
// O serviço gratuito dorme após 15 minutos sem tráfego e leva ~1 minuto para
// acordar. Em vez de deixar o Socket.IO tentar conectar direto (e mostrar um
// monte de tentativas de reconexão fracassadas), faz polling em GET /health
// a cada 2s até o serviço responder — só então libera o resto da UI para
// conectar o socket (decisão 4).

import { useEffect, useState } from 'react';

const URL_SERVIDOR = import.meta.env.VITE_SERVIDOR_URL;

const INTERVALO_ENTRE_TENTATIVAS_MS = 2_000;
const TIMEOUT_POR_TENTATIVA_MS = 8_000; // generoso: o handshake inicial pode ser lento mesmo já acordando

export interface EstadoDespertar {
  /** true assim que /health responder OK — só então é seguro conectar o socket. */
  pronto: boolean;
  /** segundos decorridos desde a primeira tentativa, para exibir na tela. */
  segundos: number;
  /** erro de configuração (ex.: VITE_SERVIDOR_URL ausente) — não é "servidor dormindo". */
  erroDeConfiguracao: string | null;
}

export function useServidorAcordado(): EstadoDespertar {
  const [pronto, setPronto] = useState(false);
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    if (!URL_SERVIDOR || pronto) return;

    let cancelado = false;
    let proximaTentativa: ReturnType<typeof setTimeout> | undefined;
    const inicio = Date.now();

    const relogio = window.setInterval(() => {
      if (!cancelado) setSegundos(Math.floor((Date.now() - inicio) / 1000));
    }, 1000);

    const tentar = async () => {
      const controlador = new AbortController();
      const abortarPorTimeout = setTimeout(() => controlador.abort(), TIMEOUT_POR_TENTATIVA_MS);

      try {
        const resposta = await fetch(`${URL_SERVIDOR}/health`, { signal: controlador.signal });
        if (!cancelado && resposta.ok) {
          setPronto(true);
          return;
        }
      } catch {
        // Servidor ainda dormindo/acordando, ou uma falha de rede passageira
        // do próprio jogador — em ambos os casos, só tenta de novo.
      } finally {
        clearTimeout(abortarPorTimeout);
      }

      if (!cancelado) {
        proximaTentativa = setTimeout(tentar, INTERVALO_ENTRE_TENTATIVAS_MS);
      }
    };

    void tentar();

    return () => {
      cancelado = true;
      clearInterval(relogio);
      if (proximaTentativa) clearTimeout(proximaTentativa);
    };
  }, [pronto]);

  return {
    pronto,
    segundos,
    erroDeConfiguracao: URL_SERVIDOR ? null : 'VITE_SERVIDOR_URL não configurada',
  };
}
