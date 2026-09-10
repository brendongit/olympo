import { describe, expect, it } from 'vitest';
import { prng } from '../aleatorio.js';
import { reduzir } from '../reduzir.js';
import { verificarInvariantes } from '../invariantes.js';
import { acaoAleatoriaLegal, novaPartida } from './ajuda.js';

const NUM_SEEDS = 50;
const TURNOS_POR_SEED = 800;

function esperarOkOuFalhar(r: { ok: boolean; motivo?: string }): void {
  if (!r.ok) {
    throw new Error(`Ação gerada como legal foi rejeitada: ${r.motivo}`);
  }
}

describe('Invariantes (Seção 15.5) — fuzz de 800 turnos por seed', () => {
  it(
    `verificarInvariantes passa após cada ação em ${NUM_SEEDS} partidas aleatórias de até ${TURNOS_POR_SEED} turnos`,
    () => {
      for (let s = 0; s < NUM_SEEDS; s++) {
        const gameSeed = `fuzz-game-${s}`;
        const actionSeed = `fuzz-acoes-${s}`;
        const numJogadores = ([2, 3, 4] as const)[s % 3]!;

        let estado = novaPartida(gameSeed, numJogadores);
        const rnd = prng(actionSeed);

        const violacoesIniciais = verificarInvariantes(estado);
        expect(violacoesIniciais, `estado inicial inválido (seed ${gameSeed})`).toEqual([]);

        for (let turno = 0; turno < TURNOS_POR_SEED; turno++) {
          if (estado.fase === 'ENCERRADO') break;

          const acao = acaoAleatoriaLegal(estado, rnd);
          const r = reduzir(estado, acao);
          if (!r.ok) {
            throw new Error(
              `Ação gerada como legal foi rejeitada (seed ${gameSeed}, turno ${turno}, ação ${JSON.stringify(
                acao,
              )}): ${r.motivo}`,
            );
          }
          estado = r.valor;

          const violacoes = verificarInvariantes(estado);
          if (violacoes.length > 0) {
            throw new Error(
              `Invariante violado (seed ${gameSeed}, turno ${turno}, ação ${JSON.stringify(acao)}): ${JSON.stringify(
                violacoes,
              )}`,
            );
          }
        }
      }
    },
    60_000,
  );

  it('Conservação de fichas nunca é violada, Chronos incluída', () => {
    let estado = novaPartida('seed-conservacao', 3);
    const rnd = prng('seed-conservacao-acoes');

    for (let turno = 0; turno < 200 && estado.fase !== 'ENCERRADO'; turno++) {
      const acao = acaoAleatoriaLegal(estado, rnd);
      const r = reduzir(estado, acao);
      esperarOkOuFalhar(r);
      if (r.ok) estado = r.valor;

      const violacoes = verificarInvariantes(estado).filter((v) => v.invariante === 1);
      expect(violacoes).toEqual([]);
    }
  });

  it('Nenhum cartaId aparece em dois lugares ao longo de uma partida curta', () => {
    let estado = novaPartida('seed-sem-duplicata', 4);
    const rnd = prng('seed-sem-duplicata-acoes');

    for (let turno = 0; turno < 200 && estado.fase !== 'ENCERRADO'; turno++) {
      const acao = acaoAleatoriaLegal(estado, rnd);
      const r = reduzir(estado, acao);
      esperarOkOuFalhar(r);
      if (r.ok) estado = r.valor;

      const violacoes = verificarInvariantes(estado).filter((v) => v.invariante === 10);
      expect(violacoes).toEqual([]);
    }
  });

  it("kleos em cache sempre bate com o recálculo, inclusive após transferências d'Os Argonautas", () => {
    let estado = novaPartida('seed-kleos-cache', 4);
    const rnd = prng('seed-kleos-cache-acoes');

    for (let turno = 0; turno < 400 && estado.fase !== 'ENCERRADO'; turno++) {
      const acao = acaoAleatoriaLegal(estado, rnd);
      const r = reduzir(estado, acao);
      esperarOkOuFalhar(r);
      if (r.ok) estado = r.valor;

      const violacoes = verificarInvariantes(estado).filter((v) => v.invariante === 4);
      expect(violacoes).toEqual([]);
    }
  });
});
