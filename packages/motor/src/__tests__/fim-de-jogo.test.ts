import { describe, expect, it } from 'vitest';
import { encerrarPartida, reduzir } from '../reduzir.js';
import type { Essencia, EstadoJogo, Jogador } from '../tipos.js';
import { ESSENCIAS } from '../tipos.js';
import { podeColherIguais, podePassar } from '../validar.js';
import { novaPartida } from './ajuda.js';

function comJogador(e: EstadoJogo, jogadorId: string, patch: Partial<Jogador>): EstadoJogo {
  return {
    ...e,
    jogadores: e.jogadores.map((j) => (j.id === jogadorId ? { ...j, ...patch } : j)),
  };
}

/** Executa uma colheita simples e válida para quem for o jogador da vez. */
function jogarTurnoSimples(e: EstadoJogo): EstadoJogo {
  const atual = e.jogadores[e.jogadorAtual]!;
  const disponiveis = ESSENCIAS.filter((x) => e.reservatorio[x] > 0) as Essencia[];
  const escolha = disponiveis.slice(0, Math.min(3, disponiveis.length));
  const r = reduzir(e, { tipo: 'COLHER_DIFERENTES', jogadorId: atual.id, essencias: escolha });
  if (!r.ok) throw new Error(`Turno falhou: ${r.motivo}`);
  return r.valor;
}

/** 18 Kléos via Santuários (6 × 3) — sobra de margem para os testes de desqualificação. */
const SANTUARIOS_18_KLEOS = ['SAN-01A', 'SAN-02A', 'SAN-03A', 'SAN-04A', 'SAN-05A', 'SAN-06A'];

function qualificarParaKeraunos(
  e: EstadoJogo,
  jogadorId: string,
  opts: { dominiosCompletos?: boolean; temChronos?: boolean } = {},
): EstadoJogo {
  const { dominiosCompletos = true, temChronos = true } = opts;
  const jogador = e.jogadores.find((j) => j.id === jogadorId)!;
  return comJogador(e, jogadorId, {
    santuarios: SANTUARIOS_18_KLEOS,
    dominios: dominiosCompletos
      ? { eter: 1, oceano: 1, terra: 1, chama: 1, sombra: 1 }
      : { eter: 1, oceano: 1, terra: 1, chama: 0, sombra: 0 },
    fichas: temChronos ? { ...jogador.fichas, chronos: 1 } : jogador.fichas,
    temChronos,
  });
}

describe('Keraunos e fim de jogo (Seção 5, 12)', () => {
  it('16+ Kléos sem 1 de cada Domínio não dispara', () => {
    let e = novaPartida('seed-keraunos-sem-dominio', 4);
    const jogadorId = e.jogadores[e.jogadorAtual]!.id;
    e = qualificarParaKeraunos(e, jogadorId, { dominiosCompletos: false, temChronos: true });

    e = jogarTurnoSimples(e);
    expect(e.fase).toBe('EM_ANDAMENTO');
  });

  it('16+ Kléos e 1 de cada Domínio, mas sem Chronos, não dispara', () => {
    let e = novaPartida('seed-keraunos-sem-chronos', 4);
    const jogadorId = e.jogadores[e.jogadorAtual]!.id;
    e = qualificarParaKeraunos(e, jogadorId, { dominiosCompletos: true, temChronos: false });

    e = jogarTurnoSimples(e);
    expect(e.fase).toBe('EM_ANDAMENTO');
  });

  it('Os três requisitos juntos disparam', () => {
    let e = novaPartida('seed-keraunos-dispara', 4);
    const jogadorId = e.jogadores[e.jogadorAtual]!.id;
    e = qualificarParaKeraunos(e, jogadorId);

    e = jogarTurnoSimples(e);
    expect(e.fase).toBe('ULTIMA_RODADA');
    expect(e.disparouUltimaRodada).toBe(jogadorId);
  });

  it('Disparo pelo último jogador da ordem encerra imediatamente, sem rodada extra', () => {
    let e = novaPartida('seed-ultimo-dispara', 4);
    while (e.jogadorAtual !== e.jogadores.length - 1) {
      e = jogarTurnoSimples(e);
    }
    const disparador = e.jogadores[e.jogadorAtual]!.id;
    e = qualificarParaKeraunos(e, disparador);
    const numeroDoTurnoAntes = e.numeroDoTurno;

    e = jogarTurnoSimples(e);

    expect(e.fase).toBe('ENCERRADO');
    expect(e.vencedores).toContain(disparador);
    // O turno que encerra a partida retorna via `encerrarPartida` antes do
    // incremento de `numeroDoTurno` (Seção 16.3) — não há rodada extra alguma.
    expect(e.numeroDoTurno).toBe(numeroDoTurnoAntes);
  });

  it('Disparo pelo primeiro em mesa de 4 ⇒ os outros 3 jogam e o jogo acaba', () => {
    let e = novaPartida('seed-fim-jogo-4p', 4);
    const disparador = e.jogadores[e.jogadorAtual]!.id;
    e = qualificarParaKeraunos(e, disparador);

    e = jogarTurnoSimples(e); // disparador -> ULTIMA_RODADA
    expect(e.fase).toBe('ULTIMA_RODADA');
    expect(e.disparouUltimaRodada).toBe(disparador);

    e = jogarTurnoSimples(e);
    e = jogarTurnoSimples(e);
    e = jogarTurnoSimples(e);

    expect(e.fase).toBe('ENCERRADO');
    expect(e.vencedores).toContain(disparador);
  });

  it('Gatilho desfeito: disparador perde Os Argonautas na rodada final, cai abaixo de 16 e ninguém mais qualifica', () => {
    let e = novaPartida('seed-gatilho-desfeito', 4);
    const disparadorId = e.jogadores[0]!.id;
    const outroId = e.jogadores[1]!.id;

    // Disparador: 13 Kléos próprios (4 santuários + 1 Lenda) + 3 d'Os
    // Argonautas = 16 exatos — exatamente o cenário da Seção 12.4.
    e = comJogador(e, disparadorId, {
      santuarios: ['SAN-01A', 'SAN-02A', 'SAN-03A', 'SAN-04A'],
      lendas: ['L1-ETE-08'],
      dominios: { eter: 1, oceano: 1, terra: 1, chama: 1, sombra: 1 },
      fichas: { ...e.jogadores[0]!.fichas, chronos: 1 },
      temChronos: true,
      simbolosArgo: 3,
    });
    // O próximo jogador tem mais símbolos: vai superar o dono na rodada final.
    e = comJogador(e, outroId, { simbolosArgo: 5 });
    e = { ...e, argonautas: { dono: disparadorId } };

    e = jogarTurnoSimples(e); // disparador dispara o gatilho
    expect(e.fase).toBe('ULTIMA_RODADA');
    expect(e.disparouUltimaRodada).toBe(disparadorId);

    e = jogarTurnoSimples(e); // outro supera e toma Os Argonautas
    expect(e.argonautas.dono).toBe(outroId);

    e = jogarTurnoSimples(e);
    e = jogarTurnoSimples(e); // último da ordem -> reavaliação

    expect(e.fase).toBe('EM_ANDAMENTO'); // ninguém mais qualifica: gatilho desfeito
    expect(e.disparouUltimaRodada).toBeNull();
    expect(e.historico.some((ev) => ev.t === 'GATILHO_DESFEITO')).toBe(true);
  });

  it('Mesmo cenário do gatilho desfeito, mas outro jogador qualifica ⇒ o jogo acaba e vence esse outro', () => {
    let e = novaPartida('seed-outro-qualifica', 4);
    const disparadorId = e.jogadores[0]!.id;
    const outroId = e.jogadores[1]!.id;

    e = comJogador(e, disparadorId, {
      santuarios: ['SAN-01A', 'SAN-02A', 'SAN-03A', 'SAN-04A'],
      lendas: ['L1-ETE-08'],
      dominios: { eter: 1, oceano: 1, terra: 1, chama: 1, sombra: 1 },
      fichas: { ...e.jogadores[0]!.fichas, chronos: 1 },
      temChronos: true,
      simbolosArgo: 3,
    });
    e = comJogador(e, outroId, {
      santuarios: ['SAN-05A', 'SAN-06A', 'SAN-01B', 'SAN-02B'],
      lendas: ['L1-OCE-08'],
      dominios: { eter: 1, oceano: 1, terra: 1, chama: 1, sombra: 1 },
      fichas: { ...e.jogadores[1]!.fichas, chronos: 1 },
      temChronos: true,
      simbolosArgo: 5,
    });
    e = { ...e, argonautas: { dono: disparadorId } };

    e = jogarTurnoSimples(e); // disparador dispara
    e = jogarTurnoSimples(e); // outro toma Os Argonautas — agora tem 13 + 3 = 16
    expect(e.argonautas.dono).toBe(outroId);
    e = jogarTurnoSimples(e);
    e = jogarTurnoSimples(e);

    expect(e.fase).toBe('ENCERRADO');
    expect(e.vencedores).toEqual([outroId]);
  });

  it('Jogador com mais Kléos que o vencedor, sem cumprir os requisitos, não entra no ranking', () => {
    let e = novaPartida('seed-fora-do-ranking', 2);
    const aId = e.jogadores[0]!.id;
    const bId = e.jogadores[1]!.id;

    // A: 18 Kléos, mas 0 Domínio de Sombra — nunca qualifica (caso de borda #20).
    e = comJogador(e, aId, {
      santuarios: SANTUARIOS_18_KLEOS,
      dominios: { eter: 1, oceano: 1, terra: 1, chama: 1, sombra: 0 },
      fichas: { ...e.jogadores[0]!.fichas, chronos: 1 },
      temChronos: true,
    });
    // B: 16 Kléos, qualifica plenamente.
    e = comJogador(e, bId, {
      santuarios: ['SAN-01B', 'SAN-02B', 'SAN-03B', 'SAN-04B', 'SAN-05B'],
      lendas: ['L1-OCE-08'],
      dominios: { eter: 1, oceano: 1, terra: 1, chama: 1, sombra: 1 },
      fichas: { ...e.jogadores[1]!.fichas, chronos: 1 },
      temChronos: true,
    });

    e = jogarTurnoSimples(e); // a: não qualifica
    expect(e.fase).toBe('EM_ANDAMENTO');
    e = jogarTurnoSimples(e); // b: qualifica e é o último -> encerra

    expect(e.fase).toBe('ENCERRADO');
    expect(e.vencedores).toEqual([bId]);
  });

  it('Desempate: mais Kléos vence', () => {
    const base = novaPartida('seed-desempate-kleos', 2);
    const a = { ...base.jogadores[0]!, kleos: 20 };
    const b = { ...base.jogadores[1]!, kleos: 16 };
    const e = { ...base, jogadores: [a, b] };

    const encerrado = encerrarPartida(e, [a, b]);
    expect(encerrado.vencedores).toEqual([a.id]);
  });

  it('Empate em Kléos: quem tem Os Argonautas vence', () => {
    const base = novaPartida('seed-desempate-argonautas', 2);
    const a = { ...base.jogadores[0]!, kleos: 16 };
    const b = { ...base.jogadores[1]!, kleos: 16 };
    const e = { ...base, jogadores: [a, b], argonautas: { dono: b.id } };

    const encerrado = encerrarPartida(e, [a, b]);
    expect(encerrado.vencedores).toEqual([b.id]);
  });

  it('Empate em Kléos e Os Argonautas: menos Lendas vence', () => {
    const base = novaPartida('seed-desempate-lendas', 2);
    const a = { ...base.jogadores[0]!, kleos: 16, lendas: ['L1-ETE-01', 'L1-ETE-02'] };
    const b = { ...base.jogadores[1]!, kleos: 16, lendas: ['L1-ETE-03'] };
    const e = { ...base, jogadores: [a, b] };

    const encerrado = encerrarPartida(e, [a, b]);
    expect(encerrado.vencedores).toEqual([b.id]);
  });

  it('Empate total ⇒ vitória compartilhada', () => {
    const base = novaPartida('seed-empate-total', 2);
    const a = { ...base.jogadores[0]!, kleos: 16, lendas: ['L1-ETE-01', 'L1-ETE-02'] };
    const b = { ...base.jogadores[1]!, kleos: 16, lendas: ['L1-ETE-03', 'L1-ETE-04'] };
    const e = { ...base, jogadores: [a, b] };

    const encerrado = encerrarPartida(e, [a, b]);
    expect(new Set(encerrado.vencedores)).toEqual(new Set([a.id, b.id]));
  });

  it('Nenhuma ação é legal depois que a partida está ENCERRADO', () => {
    const base = novaPartida('seed-pos-encerrado', 2);
    const jogadorId = base.jogadores[base.jogadorAtual]!.id;
    const comPilhaCheia = { ...base, reservatorio: { ...base.reservatorio, eter: 4 } };
    const encerrado = encerrarPartida(comPilhaCheia, comPilhaCheia.jogadores);

    const p1 = podePassar(encerrado, jogadorId);
    const p2 = podeColherIguais(encerrado, jogadorId, 'eter');
    expect(p1).toEqual({ ok: false, motivo: 'A partida já terminou' });
    expect(p2).toEqual({ ok: false, motivo: 'A partida já terminou' });
  });
});
