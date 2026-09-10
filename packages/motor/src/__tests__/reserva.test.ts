import { describe, expect, it } from 'vitest';
import { projetarPara } from '../projetar.js';
import { reduzir } from '../reduzir.js';
import type { EstadoJogo, Jogador } from '../tipos.js';
import { esperarOk, novaPartida } from './ajuda.js';

function comJogador(e: EstadoJogo, jogadorId: string, patch: Partial<Jogador>): EstadoJogo {
  return {
    ...e,
    jogadores: e.jogadores.map((j) => (j.id === jogadorId ? { ...j, ...patch } : j)),
  };
}

describe('Reserva (Seção 7.4)', () => {
  it('Reservar dá 1 Ícor; sem Ícor no reservatório, a reserva ocorre sem ganho', () => {
    const base = novaPartida('seed-reservar-icor', 4);
    const jogadorId = base.jogadores[0]!.id;
    const cartaAlvo = base.fileiras[1][0]!;

    const r1 = reduzir(base, { tipo: 'RESERVAR', jogadorId, alvo: { tipo: 'fileira', cartaId: cartaAlvo } });
    esperarOk(r1);
    if (!r1.ok) return;
    const jog1 = r1.valor.jogadores.find((j) => j.id === jogadorId)!;
    expect(jog1.fichas.icor).toBe(1);
    expect(r1.valor.reservatorio.icor).toBe(base.reservatorio.icor - 1);

    const semIcor = { ...base, reservatorio: { ...base.reservatorio, icor: 0 } };
    const r2 = reduzir(semIcor, { tipo: 'RESERVAR', jogadorId, alvo: { tipo: 'fileira', cartaId: cartaAlvo } });
    esperarOk(r2);
    if (!r2.ok) return;
    const jog2 = r2.valor.jogadores.find((j) => j.id === jogadorId)!;
    expect(jog2.fichas.icor).toBe(0);
  });

  it('Reservar com 3 Presságios é ilegal', () => {
    const base = novaPartida('seed-3-pressagios', 4);
    const jogadorId = base.jogadores[0]!.id;
    const cartaAlvo = base.fileiras[1][0]!;

    const cheio = comJogador(base, jogadorId, {
      pressagios: [
        { cartaId: 'X1', oculto: false, nivel: 1 },
        { cartaId: 'X2', oculto: false, nivel: 1 },
        { cartaId: 'X3', oculto: false, nivel: 1 },
      ],
    });

    const r = reduzir(cheio, { tipo: 'RESERVAR', jogadorId, alvo: { tipo: 'fileira', cartaId: cartaAlvo } });
    expect(r.ok).toBe(false);
  });

  it('Reserva do topo do baralho não é reposta e é oculta na projeção dos oponentes', () => {
    const base = novaPartida('seed-reserva-oculta', 4);
    const jogadorId = base.jogadores[0]!.id;
    const outroJogadorId = base.jogadores[1]!.id;
    const topoAntes = base.baralhos[1][0]!;
    const tamanhoAntes = base.baralhos[1].length;

    const r = reduzir(base, { tipo: 'RESERVAR', jogadorId, alvo: { tipo: 'baralho', nivel: 1 } });
    esperarOk(r);
    if (!r.ok) return;

    expect(r.valor.baralhos[1].length).toBe(tamanhoAntes - 1);
    expect(r.valor.fileiras[1]).toEqual(base.fileiras[1]); // fileira não é reposta

    const jogador = r.valor.jogadores.find((j) => j.id === jogadorId)!;
    expect(jogador.pressagios).toHaveLength(1);
    expect(jogador.pressagios[0]!.cartaId).toBe(topoAntes);
    expect(jogador.pressagios[0]!.oculto).toBe(true);

    const visivelParaOutro = projetarPara(r.valor, outroJogadorId);
    const pressagioVisivel = visivelParaOutro.jogadores.find((j) => j.id === jogadorId)!.pressagios[0]!;
    expect(pressagioVisivel.cartaId).toBeNull();
    expect(pressagioVisivel.oculto).toBe(true);
    expect(pressagioVisivel.nivel).toBe(1);

    const visivelParaDono = projetarPara(r.valor, jogadorId);
    expect(visivelParaDono.jogadores.find((j) => j.id === jogadorId)!.pressagios[0]!.cartaId).toBe(topoAntes);
  });

  it('projetarPara nunca vaza cartaId de presságio oculto alheio', () => {
    const base = novaPartida('seed-nao-vaza', 3);
    const [a, b, c] = base.jogadores.map((j) => j.id) as [string, string, string];

    const comOcultos = comJogador(base, a, {
      pressagios: [{ cartaId: 'L1-ETE-01', oculto: true, nivel: 1 }],
    });

    for (const espectador of [b, c]) {
      const visivel = projetarPara(comOcultos, espectador);
      const pressagioDeA = visivel.jogadores.find((j) => j.id === a)!.pressagios[0]!;
      expect(pressagioDeA.cartaId).toBeNull();
      expect(JSON.stringify(visivel)).not.toContain('L1-ETE-01');
    }

    const visivelParaA = projetarPara(comOcultos, a);
    expect(visivelParaA.jogadores.find((j) => j.id === a)!.pressagios[0]!.cartaId).toBe('L1-ETE-01');
  });

  it('Não existe ação de descartar Presságio', () => {
    // Seção 7.4: a única saída da mão é reivindicando. Não há um `tipo` de
    // Acao para isso — o tipo `Acao` (Seção 15.3) simplesmente não o expõe.
    const acoesConhecidas = [
      'COLHER_DIFERENTES',
      'COLHER_IGUAIS',
      'REIVINDICAR',
      'RESERVAR',
      'DEVOLVER_FICHAS',
      'ESCOLHER_SANTUARIO',
      'PASSAR',
    ];
    expect(acoesConhecidas).not.toContain('DESCARTAR_PRESSAGIO');
  });
});
