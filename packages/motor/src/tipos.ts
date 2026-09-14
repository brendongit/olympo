// Seção 14 — Tipos base

export const ESSENCIAS = ['eter', 'oceano', 'terra', 'chama', 'sombra'] as const;
export type Essencia = (typeof ESSENCIAS)[number];

/** Ícor e Chronos são fichas "fora do mercado": nunca aparecem em custos, nunca são pegas por A/B. */
export type Ficha = Essencia | 'icor' | 'chronos';
export const FICHAS: readonly Ficha[] = [...ESSENCIAS, 'icor', 'chronos'];

export type Custo = Record<Essencia, number>;
export type Bolsa = Record<Ficha, number>;

export interface Lenda {
  id: string;
  nivel: 1 | 2 | 3;
  dominio: Essencia;
  kleos: number;
  custo: Custo;
  /** Símbolos do Argo: 0, 1 ou 2. Contam para a posse d'Os Argonautas (Seção 11). */
  argo: 0 | 1 | 2;
  /** Marca de Chronos: presente em todas as cartas de nível 3 e em nenhuma outra. */
  chronos: boolean;
  nome: string;
  /** URL da arte de fundo da carta — puramente visual, opcional. Ausente ⇒ UI mostra um placeholder. */
  arte?: string;
}

/** Uma das 12 faces de Santuário (6 cartões de dupla face). Ver Seção 10. */
export interface FaceSantuario {
  id: string;
  cartao: number; // 1..6 — um cartão só entra em jogo por uma face
  face: 'A' | 'B';
  nome: string;
  patrono: string;
  kleos: 3;
  requisito: Custo;
}

// Seção 15.2 — Tipos de estado

export type FaseJogo = 'AGUARDANDO_JOGADORES' | 'EM_ANDAMENTO' | 'ULTIMA_RODADA' | 'ENCERRADO';

export type SubFaseTurno =
  | 'ESCOLHENDO_ACAO' // estado normal: aguarda a ação principal
  | 'DESCARTANDO' // passou de 10 fichas, precisa devolver
  | 'ESCOLHENDO_SANTUARIO'; // qualificou para 2+ santuários, precisa escolher

export interface Jogador {
  id: string; // uuid estável
  nome: string;
  avatar: string;
  ordem: number; // 0..3, posição fixa na mesa
  fichas: Bolsa; // essências + ícor + chronos na mão
  lendas: string[]; // ids das Lendas reivindicadas
  dominios: Custo; // derivado de `lendas`, mantido em cache
  pressagios: Pressagio[]; // máx. 3
  santuarios: string[]; // ids das faces recebidas
  simbolosArgo: number; // derivado: Σ argo das lendas, em cache
  temChronos: boolean; // derivado: fichas.chronos > 0
  kleos: number; // derivado (INCLUI Os Argonautas), mantido em cache
  conectado: boolean;
  turnosAusente: number; // para auto-kick
}

/** Estado real, autoritativo — vive só no servidor. `cartaId` nunca é nulo aqui. */
export interface Pressagio {
  cartaId: string;
  oculto: boolean; // true = reservado do topo do baralho
  nivel: 1 | 2 | 3; // sempre público, mesmo se oculto
}

/** Visão projetada (Seção 18): `cartaId` vira null para presságios ocultos alheios. */
export interface PressagioVisivel {
  cartaId: string | null;
  oculto: boolean;
  nivel: 1 | 2 | 3;
}

export interface EstadoJogo {
  partidaId: string;
  seed: string; // gera todo o embaralhamento
  fase: FaseJogo;
  subFase: SubFaseTurno;

  jogadores: Jogador[];
  jogadorAtual: number; // índice em `jogadores`
  numeroDoTurno: number; // contador global, começa em 0

  reservatorio: Bolsa; // fichas disponíveis no centro, inclui ícor e chronos

  baralhos: { 1: string[]; 2: string[]; 3: string[] }; // ids, topo = índice 0
  fileiras: {
    1: (string | null)[]; // sempre length 4; null = espaço vazio permanente
    2: (string | null)[];
    3: (string | null)[];
  };

  santuariosDisponiveis: string[]; // ids de FACE, já sorteadas no setup
  argonautas: { dono: string | null }; // itinerante

  // controle de fim de jogo
  disparouUltimaRodada: string | null; // id do jogador que cumpriu o Keraunos
  vencedores: string[]; // preenchido em ENCERRADO
  /** true só quando ENCERRADO veio de ENCERRAR_ABANDONO — sem vencedores (Seção 17.6). */
  encerradaPorAbandono: boolean;

  // sub-fases pendentes
  descartePendente: { jogadorId: string; excedente: number } | null;
  escolhaSantuarioPendente: { jogadorId: string; opcoes: string[] } | null;

  historico: EventoJogo[]; // log completo, para replay e para o feed da UI
  atualizadoEm: number; // epoch ms, do servidor
  prazoDoTurno: number | null; // epoch ms, se houver timer
}

// Seção 18 — Projeção pública

export interface JogadorVisivel extends Omit<Jogador, 'pressagios'> {
  pressagios: PressagioVisivel[];
}

export type EstadoVisivel = Omit<EstadoJogo, 'seed' | 'baralhos' | 'jogadores'> & {
  seed?: string;
  baralhos: { 1: number; 2: number; 3: number };
  jogadores: JogadorVisivel[];
};

// Seção 16.1: "A UI usa exatamente estas funções [podeX] para desabilitar
// botões antes do clique" — vale tanto no servidor (EstadoJogo bruto) quanto
// no cliente (EstadoVisivel, via projetarPara). `validar.ts` aceita os dois.
export type EstadoOuVisivel = EstadoJogo | EstadoVisivel;
export type JogadorOuVisivel = Jogador | JogadorVisivel;

// Seção 15.3 — Tipos de ação

export type Acao =
  | { tipo: 'COLHER_DIFERENTES'; jogadorId: string; essencias: Essencia[] } // 1 a 3 tipos distintos
  | { tipo: 'COLHER_IGUAIS'; jogadorId: string; essencia: Essencia }
  | { tipo: 'REIVINDICAR'; jogadorId: string; cartaId: string; origem: 'fileira' | 'pressagio' }
  | {
      tipo: 'RESERVAR';
      jogadorId: string;
      alvo: { tipo: 'fileira'; cartaId: string } | { tipo: 'baralho'; nivel: 1 | 2 | 3 };
    }
  | { tipo: 'DEVOLVER_FICHAS'; jogadorId: string; fichas: Partial<Bolsa> }
  | { tipo: 'ESCOLHER_SANTUARIO'; jogadorId: string; santuarioId: string }
  | { tipo: 'PASSAR'; jogadorId: string } // só quando não há ação legal
  | { tipo: 'ENCERRAR_ABANDONO'; jogadorId: string }; // Seção 17.6 — votação de encerramento por abandono

// Seção 17.5 — Eventos de jogo (para animação e feed)

export type EventoJogo =
  | { t: 'COLHEU'; jogadorId: string; fichas: Partial<Bolsa> }
  | {
      t: 'REIVINDICOU';
      jogadorId: string;
      cartaId: string;
      pagamento: Bolsa;
      origem: 'fileira' | 'pressagio';
      reposta: string | null;
    }
  | { t: 'GANHOU_CHRONOS'; jogadorId: string; cartaId: string }
  | {
      t: 'RESERVOU';
      jogadorId: string;
      cartaId: string | null;
      nivel: 1 | 2 | 3;
      oculto: boolean;
      ganhouIcor: boolean;
      reposta: string | null;
    }
  | { t: 'DEVOLVEU'; jogadorId: string; fichas: Partial<Bolsa> }
  | { t: 'ARGONAUTAS'; de: string | null; para: string; simbolos: number }
  | { t: 'SANTUARIO'; jogadorId: string; santuarioId: string }
  | { t: 'PASSOU'; jogadorId: string; motivo: string }
  | { t: 'ULTIMA_RODADA'; jogadorId: string }
  | { t: 'GATILHO_DESFEITO' }
  | { t: 'FIM'; vencedores: string[] }
  | { t: 'ENCERRADA_POR_ABANDONO'; jogadorId: string };

// Resultado de validação (Seção 16.1)

export type Resultado = { ok: true } | { ok: false; motivo: string };
