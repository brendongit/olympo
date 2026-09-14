// Renderização da carta (Seção 17.5). Este componente é "burro": recebe
// resultados já calculados pelo motor (podeReivindicar/podeReservar/
// calcularPagamento) e só decide como desenhar — nenhuma regra é decidida
// aqui.
//
// Layout estilo TCG (moldura na cor do domínio + arte + sidebar de atributos), todo em %
// do próprio card via container queries (cqw) — nenhuma medida de layout em
// px fixo, então o card escala igual em qualquer largura (mini ou completo).
// Mapeamento de dado pra slot visual: kléos → número grande (canto sup.
// esquerdo), custo por essência → badges da sidebar, domínio → medalhão
// (canto sup. direito, é o "elemento" da carta), nome → faixa inferior,
// `lenda.arte` → arte de fundo (placeholder cinza-azulado se ausente).

import {
  useReducedMotion,
  useSpring,
  useTransform,
  motion,
  useMotionValue,
} from "framer-motion";
import type { Bolsa, Essencia, Lenda } from "@olympos/motor";
import {
  estiloAltoContraste,
  INFO_FICHA,
  ORDEM_ESSENCIAS,
} from "../lib/tema.js";
import { usePreferencias } from "../loja/usePreferencias.js";

export interface AcaoCarta {
  rotulo: string;
  habilitado: boolean;
  motivo?: string;
  aoClicar: () => void;
  destaque?: boolean;
}

interface CartaLendaProps {
  lenda: Lenda;
  /** Resultado de calcularPagamento(jogadorDaVez, lenda) — omitido quando não é a vez de ninguém interagir. */
  pagamento?: { possivel: boolean; pagamento: Bolsa } | undefined;
  acoes: AcaoCarta[];
  reservaOculta?: boolean; // presságio próprio ainda oculto para os outros — só um lembrete visual
  /** Necessário só para cartas de nível 3, para decidir se a Marca de Chronos pulsa (Seção 19.6). */
  jogadorTemChronos?: boolean;
  /** 'mini' é usado nas pilhas de cartas conquistadas (Domínios) — card reduzido, sem sidebar/badges. */
  tamanho?: "completo" | "mini";
  /** Abre o foco da carta (ModalFocoCarta, onde vivem as ações) ao clicar em qualquer parte do card. */
  aoClicarCard?: () => void;
  /** Sobrescreve a largura padrão de `tamanho` (ex.: ModalFocoCarta exibindo a carta em destaque, maior). */
  larguraPx?: number;
}

type EstiloCSS = React.CSSProperties &
  Record<string, string | number | undefined>;

const TOKENS = {
  contorno: "#3E3E3E",
};

// Paleta fixa da spec (gold/amber/violet/crimson/azure), mapeada preservando
// a associação essência↔cor que já existia (oceano=azul, chama=vermelho,
// sombra=violeta); éter e terra dividem gold/amber por não haver "verde" na
// paleta nova — o ícone de cada essência continua diferenciando visualmente.
const CORES_BADGE: Record<
  Essencia,
  { light: string; base: string; dark: string }
> = {
  eter: { light: "#F2E23C", base: "#D6C00C", dark: "#8C7D06" }, // gold
  oceano: { light: "#3F97E0", base: "#1B62B5", dark: "#14356F" }, // azure
  terra: { light: "#F7A733", base: "#E08205", dark: "#7A4708" }, // amber
  chama: { light: "#FD8B84", base: "#F0655A", dark: "#C23B2C" }, // crimson
  sombra: { light: "#C05FC2", base: "#9B3E9D", dark: "#5C245D" }, // violet
};
// Ícor não faz parte da paleta de 5 cores da spec (é ficha "fora do
// mercado") — tom amarelo derivado da cor que o resto da UI já usa pra ele.
const COR_BADGE_ICOR = { light: "#FDE68A", base: "#EAB308", dark: "#854D0E" };

const FONTE_DISPLAY =
  "'Kelly Slab','Big Shoulders Display','Oswald',Impact,system-ui,sans-serif";

function gradienteRadialBadge(cores: {
  light: string;
  base: string;
  dark: string;
}): string {
  return `radial-gradient(circle at 32% 28%, ${cores.light} 0%, ${cores.base} 55%, ${cores.dark} 100%)`;
}

/** A moldura (fundo/header/faixa de nome) acompanha a cor do domínio da carta — é o "elemento" dela. */
function molduraPorDominio(dominio: Essencia): string {
  return CORES_BADGE[dominio].base;
}

/** Preenchimento branco sólido com contorno escuro — números/nome em relevo, estilo TCG. */
function estiloTextoTCG(fontSizeCqw: number, corTexto = "#FFFFFF"): EstiloCSS {
  return {
    fontFamily: FONTE_DISPLAY,
    fontWeight: 800,
    fontSize: `${fontSizeCqw}cqw`,
    lineHeight: 1,
    color: corTexto,
    WebkitTextStroke: `1px ${TOKENS.contorno}`,
    paintOrder: "stroke fill",
    textShadow: `-1px -1px 0 ${TOKENS.contorno}, 1px -1px 0 ${TOKENS.contorno}, -1px 1px 0 ${TOKENS.contorno}, 1px 1px 0 ${TOKENS.contorno}`,
  };
}

// Espaçamento vertical igual dos badges de atributo na sidebar — faixa
// utilizável derivada dos exemplos da spec (N=5 → centros em 31.19% /
// 45.87% / 60.55% / 75.23% / 89.91%, passo constante de 14.68%).
const BADGES_TOPO_UTIL = 23.85;
const BADGES_ALTURA_UTIL = 73.4;

const SUPORTA_TILT_FINO =
  typeof window !== "undefined" &&
  window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;

export function CartaLenda({
  lenda,
  pagamento,
  acoes,
  reservaOculta,
  jogadorTemChronos,
  tamanho = "completo",
  aoClicarCard,
  larguraPx,
}: CartaLendaProps) {
  const altoContraste = usePreferencias((s) => s.altoContraste);
  const animacoesReduzidas = usePreferencias((s) => s.animacoesReduzidas);
  const reduzMotionSO = useReducedMotion();
  const mini = tamanho === "mini";
  const precisaIcor = !!pagamento?.possivel && pagamento.pagamento.icor > 0;
  const reivindicavelDireto =
    !!pagamento?.possivel && pagamento.pagamento.icor === 0;

  const tiltAtivo =
    !mini &&
    SUPORTA_TILT_FINO &&
    animacoesReduzidas !== "sempre" &&
    !reduzMotionSO;
  const ponteiroX = useMotionValue(0.5);
  const ponteiroY = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(ponteiroY, [0, 1], [8, -8]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(ponteiroX, [0, 1], [-8, 8]), {
    stiffness: 300,
    damping: 30,
  });

  function aoMoverPonteiro(ev: React.PointerEvent<HTMLDivElement>) {
    if (!tiltAtivo) return;
    const rect = ev.currentTarget.getBoundingClientRect();
    ponteiroX.set((ev.clientX - rect.left) / rect.width);
    ponteiroY.set((ev.clientY - rect.top) / rect.height);
  }

  function aoSairPonteiro() {
    ponteiroX.set(0.5);
    ponteiroY.set(0.5);
  }

  function aoTeclarCard(ev: React.KeyboardEvent<HTMLDivElement>) {
    if (!aoClicarCard) return;
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      aoClicarCard();
    }
  }

  const custosVisiveis = ORDEM_ESSENCIAS.filter((e) => lenda.custo[e] > 0);
  const concedeChronos = lenda.chronos && !jogadorTemChronos;
  const nomeExibido = reservaOculta ? "🂠 (só você vê)" : lenda.nome;

  // Sem medida de shrink-to-fit nativa em CSS puro — aproxima reduzindo a
  // fonte pra nomes longos em vez de truncar (a spec pede "sem reticências
  // se der pra reduzir a fonte").
  const NOME_FONTE_BASE_CQW = 10;
  const NOME_CARACTERES_BASE = 8;
  const nomeFonteCqw =
    nomeExibido.length <= NOME_CARACTERES_BASE
      ? NOME_FONTE_BASE_CQW
      : Math.max(
          NOME_FONTE_BASE_CQW * (NOME_CARACTERES_BASE / nomeExibido.length),
          NOME_FONTE_BASE_CQW * 0.55,
        );

  const itensBadge = mini
    ? []
    : [
        ...custosVisiveis.map((e) => ({
          chave: e as Essencia | "icor",
          valor: lenda.custo[e],
          cores: CORES_BADGE[e],
          rotulo: INFO_FICHA[e].rotulo,
        })),
        ...(precisaIcor
          ? [
              {
                chave: "icor" as const,
                valor: pagamento!.pagamento.icor,
                cores: COR_BADGE_ICOR,
                rotulo: INFO_FICHA.icor.rotulo,
              },
            ]
          : []),
      ];

  // Seção 20: aria-label completo — nome/nível/domínio/kléos/argo/chronos +
  // custo por extenso + estado de cada ação, pra não depender só do visual.
  const custoFalado =
    custosVisiveis.length === 0
      ? "grátis"
      : `custo ${custosVisiveis
          .map((e) => `${lenda.custo[e]} ${INFO_FICHA[e].rotulo}`)
          .join(", ")
          .replace(/, ([^,]*)$/, " e $1")}`;
  const estadosFalados = acoes
    .map(
      (a) =>
        `${a.habilitado ? "Você pode" : "Não é possível"} ${a.rotulo.toLowerCase()}${!a.habilitado && a.motivo ? ` (${a.motivo})` : ""}`,
    )
    .join(". ");

  const corContornoRoot =
    reivindicavelDireto || precisaIcor ? "#FBBF24" : TOKENS.contorno;
  const alturaArte = mini ? 69.26 : 68.81; // completo: até a faixa de nome (91.74%); mini: sem sidebar, mesma régua

  return (
    <div style={tiltAtivo ? { perspective: 800 } : undefined}>
      <motion.div
        layoutId={`carta-${lenda.id}`}
        onPointerMove={aoMoverPonteiro}
        onPointerLeave={aoSairPonteiro}
        onClick={aoClicarCard}
        onKeyDown={aoClicarCard ? aoTeclarCard : undefined}
        tabIndex={aoClicarCard ? 0 : undefined}
        style={
          {
            ...(tiltAtivo ? { rotateX, rotateY } : {}),
            containerType: "inline-size",
            position: "relative",
            isolation: "isolate",
            overflow: "hidden",
            aspectRatio: "5 / 7",
            borderRadius: "7.7% / 5.5%",
            border: `1.5px solid ${corContornoRoot}`,
            background: molduraPorDominio(lenda.dominio),
            boxShadow: reivindicavelDireto
              ? "0 0 10px rgba(251,191,36,0.5)"
              : undefined,
            width: larguraPx,
          } as EstiloCSS
        }
        className={`${mini ? "w-14" : "w-36"} ${aoClicarCard ? "cursor-pointer" : ""} ${
          reivindicavelDireto ? "animate-pulse motion-reduce:animate-none" : ""
        }`}
        aria-label={`${lenda.nome}, nível ${lenda.nivel}, domínio ${INFO_FICHA[lenda.dominio].rotulo}, ${lenda.kleos} Kléos${
          lenda.argo > 0
            ? `, ${lenda.argo} símbolo${lenda.argo > 1 ? "s" : ""} do Argo`
            : ""
        }${concedeChronos ? ", concede a Essência de Chronos" : ""}, ${custoFalado}${estadosFalados ? `. ${estadosFalados}` : ""}`}
      >
        {/* 1. Arte — sangra até a borda direita; placeholder se `arte` ausente */}
        <div
          style={{
            position: "absolute",
            left: mini ? 0 : "26.92%",
            top: "22.48%",
            width: mini ? "100%" : "73.08%",
            height: `${alturaArte}%`,
            overflow: "hidden",
            borderBottom: `1px solid ${TOKENS.contorno}`,
            zIndex: 1,
          }}
        >
          {lenda.arte ? (
            <img
              src={lenda.arte}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
          ) : (
            <div
              style={{ width: "100%", height: "100%", background: "#5C6B73" }}
            />
          )}
        </div>

        {/* 2. Sidebar — só no completo; desce até a base, por trás da faixa de nome */}
        {!mini && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "22.48%",
              width: "26.28%",
              height: "77.52%",
              background:
                "linear-gradient(180deg,#C9D2CC 0%,#F6E7CC 28%,#FDF8E6 48%,#E2E7E4 70%,#C3D2D3 100%)",
              borderRight: `1px solid ${TOKENS.contorno}`,
              zIndex: 2,
            }}
          />
        )}

        {/* 3. Faixa de nome */}
        <div
          style={{
            position: "absolute",
            left: mini ? 0 : "26.92%",
            top: "91.74%",
            width: mini ? "100%" : "73.08%",
            height: "7.80%",
            background: molduraPorDominio(lenda.dominio),
            display: "flex",
            alignItems: "center",
            justifyContent: mini ? "center" : "flex-end",
            paddingRight: mini ? 0 : "12.2%",
            overflow: "hidden",
            zIndex: 3,
          }}
        >
          <span
            style={{
              ...estiloTextoTCG(nomeFonteCqw),
              whiteSpace: "nowrap",
              maxWidth: "87%",
              overflow: "hidden",
            }}
            title={lenda.nome}
          >
            {nomeExibido}
          </span>
        </div>

        {/* 4. Header */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "22.02%",
            background: molduraPorDominio(lenda.dominio),
            zIndex: 4,
          }}
        />

        {/* Argo/Chronos — sem slot próprio na spec; espaço livre do header, só no completo */}
        {!mini && (lenda.argo > 0 || lenda.chronos) && (
          <div
            style={{
              position: "absolute",
              top: "2%",
              left: "20%",
              width: "58%",
              height: "18%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4%",
              zIndex: 5,
            }}
          >
            {lenda.argo > 0 && (
              <span
                style={estiloTextoTCG(4.5)}
                title={`${lenda.argo} símbolo(s) do Argo`}
              >
                {"⛵".repeat(lenda.argo)}
              </span>
            )}
            {lenda.chronos && (
              <span
                style={estiloTextoTCG(
                  5.5,
                  concedeChronos ? "#FCD34D" : "#9CA3AF",
                )}
                className={
                  concedeChronos
                    ? "animate-pulse motion-reduce:animate-none"
                    : ""
                }
                title={
                  concedeChronos
                    ? "Concede a Essência de Chronos"
                    : "Marca de Chronos — você já tem a Essência"
                }
              >
                ⧗
              </span>
            )}
          </div>
        )}

        {/* 5. Custo (Kléos) */}
        <div
          style={{
            position: "absolute",
            left: "6.41%",
            top: "3.67%",
            width: "12.82%",
            height: "13.76%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5,
          }}
        >
          <span style={estiloTextoTCG(21.7)} title="Kléos">
            {lenda.kleos > 0 ? lenda.kleos : "—"}
          </span>
        </div>

        {/* 6. Badges de atributo (custo por essência + Ícor se precisar) */}
        {itensBadge.map((item, i) => {
          const passo = BADGES_ALTURA_UTIL / itensBadge.length;
          const centroTopo = BADGES_TOPO_UTIL + passo * (i + 0.5);
          return (
            <div
              key={item.chave}
              title={item.rotulo}
              style={{
                position: "absolute",
                left: "11.22%",
                top: `${centroTopo}%`,
                width: "14.10%",
                aspectRatio: "1 / 1",
                transform: "translate(-50%, -50%)",
                zIndex: 6,
              }}
            >
              {/* satélite — atrás do principal, mesma cor */}
              <div
                style={{
                  position: "absolute",
                  left: "75.05%",
                  top: "47.75%",
                  width: "54.5%",
                  height: "54.5%",
                  borderRadius: "50%",
                  backgroundImage: gradienteRadialBadge(item.cores),
                  outline: "1px solid rgba(62,62,62,0.7)",
                }}
              />
              {/* principal */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  backgroundImage: gradienteRadialBadge(item.cores),
                  outline: "1px solid rgba(62,62,62,0.7)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {altoContraste && item.chave !== "icor" && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={estiloAltoContraste(item.chave, true)}
                  />
                )}
                <span style={estiloTextoTCG(8.46)}>{item.valor}</span>
              </div>
            </div>
          );
        })}

        {/* 7. Medalhão — domínio/elemento da carta */}
        <div
          style={{
            position: "absolute",
            left: "79.15%",
            top: "8.92%",
            width: "17.3%",
            aspectRatio: "1 / 1",
            zIndex: 7,
          }}
          title={`Domínio: ${INFO_FICHA[lenda.dominio].rotulo}`}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#E8EFEE,#A9BBBC 60%,#E8EFEE)",
              outline: `1px solid ${TOKENS.contorno}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "7%",
              borderRadius: "50%",
              background: gradienteRadialBadge(CORES_BADGE[lenda.dominio]),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "7.79cqw",
            }}
          >
            {INFO_FICHA[lenda.dominio].icone}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
