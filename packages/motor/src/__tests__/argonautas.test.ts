import { describe, expect, it } from 'vitest';
import { LENDAS } from '../dados/lendas.js';
import { reduzir } from '../reduzir.js';
import type { EstadoJogo, Jogador } from '../tipos.js';
import { esperarOk, novaPartida } from './ajuda.js';

function comJogador(e: EstadoJogo, jogadorId: string, patch: Partial<Jogador>): EstadoJogo {
  return {
    ...e,
    jogadores: e.jogadores.map((j) => (j.id === jogadorId ? { ...j, ...patch } : j)),
  };
}

describe("Os Argonautas (Seção 11)", () => {
  it('Ninguém recebe a carta com menos de 3 símbolos', () => {
    const base = novaPartida('seed-argo-abaixo-limiar', 4);
    const jogadorId = base.jogadores[base.jogadorAtual]!.id;
    const estado = comJogador(base, jogadorId, { simbolosArgo: 2 });

    const r = reduzir(estado, {
      tipo: 'COLHER_DIFERENTES',
      jogadorId,
      essencias: ['eter', 'oceano', 'terra'],
    });
    esperarOk(r);
    if (!r.ok) return;

    expect(r.valor.argonautas.dono).toBeNull();
  });

  it('O primeiro a chegar a 3 símbolos recebe automaticamente', () => {
    const base = novaPartida('seed-argo-primeiro', 4);
    const jogadorId = base.jogadores[base.jogadorAtual]!.id;
    const estado = comJogador(base, jogadorId, { simbolosArgo: 3 });

    const r = reduzir(estado, {
      tipo: 'COLHER_DIFERENTES',
      jogadorId,
      essencias: ['eter', 'oceano', 'terra'],
    });
    esperarOk(r);
    if (!r.ok) return;

    expect(r.valor.argonautas.dono).toBe(jogadorId);
    const jogador = r.valor.jogadores.find((j) => j.id === jogadorId)!;
    expect(jogador.kleos).toBe(3);
  });

  it('Empate em símbolos mantém o dono atual', () => {
    let e = novaPartida('seed-argo-empate', 4);
    const donoId = e.jogadores[0]!.id;
    const desafianteId = e.jogadores[1]!.id;

    e = comJogador(e, donoId, { simbolosArgo: 4 });
    let r = reduzir(e, { tipo: 'COLHER_DIFERENTES', jogadorId: donoId, essencias: ['eter', 'oceano', 'terra'] });
    esperarOk(r);
    if (!r.ok) return;
    e = r.valor;
    expect(e.argonautas.dono).toBe(donoId);

    e = comJogador(e, desafianteId, { simbolosArgo: 4 }); // empata, não supera
    r = reduzir(e, { tipo: 'COLHER_DIFERENTES', jogadorId: desafianteId, essencias: ['eter', 'oceano', 'terra'] });
    esperarOk(r);
    if (!r.ok) return;

    expect(r.valor.argonautas.dono).toBe(donoId); // é preciso superar, não igualar
  });

  it("Superar o dono transfere a carta e os 3 Kléos no mesmo instante", () => {
    let e = novaPartida('seed-argo-supera', 4);
    const donoId = e.jogadores[0]!.id;
    const desafianteId = e.jogadores[1]!.id;

    e = comJogador(e, donoId, { simbolosArgo: 4 });
    let r = reduzir(e, { tipo: 'COLHER_DIFERENTES', jogadorId: donoId, essencias: ['eter', 'oceano', 'terra'] });
    esperarOk(r);
    if (!r.ok) return;
    e = r.valor;
    expect(e.argonautas.dono).toBe(donoId);
    expect(e.jogadores.find((j) => j.id === donoId)!.kleos).toBe(3);

    e = comJogador(e, desafianteId, { simbolosArgo: 5 });
    r = reduzir(e, { tipo: 'COLHER_DIFERENTES', jogadorId: desafianteId, essencias: ['eter', 'oceano', 'terra'] });
    esperarOk(r);
    if (!r.ok) return;

    expect(r.valor.argonautas.dono).toBe(desafianteId);
    const donoAntigo = r.valor.jogadores.find((j) => j.id === donoId)!;
    const novoDono = r.valor.jogadores.find((j) => j.id === desafianteId)!;
    expect(donoAntigo.kleos).toBe(0); // caiu 3
    expect(novoDono.kleos).toBe(3); // subiu 3
  });

  it('A carta pode trocar de mãos mais de uma vez na mesma partida', () => {
    let e = novaPartida('seed-argo-varias-trocas', 4);
    const [aId, bId, cId] = e.jogadores.map((j) => j.id) as [string, string, string, string];

    e = comJogador(e, aId, { simbolosArgo: 3 });
    let r = reduzir(e, { tipo: 'COLHER_DIFERENTES', jogadorId: aId, essencias: ['eter', 'oceano', 'terra'] });
    esperarOk(r);
    if (!r.ok) return;
    e = r.valor;
    expect(e.argonautas.dono).toBe(aId);

    e = comJogador(e, bId, { simbolosArgo: 4 });
    r = reduzir(e, { tipo: 'COLHER_DIFERENTES', jogadorId: bId, essencias: ['eter', 'oceano', 'terra'] });
    esperarOk(r);
    if (!r.ok) return;
    e = r.valor;
    expect(e.argonautas.dono).toBe(bId);

    e = comJogador(e, cId, { simbolosArgo: 5 });
    r = reduzir(e, { tipo: 'COLHER_DIFERENTES', jogadorId: cId, essencias: ['eter', 'oceano', 'terra'] });
    esperarOk(r);
    if (!r.ok) return;
    e = r.valor;
    expect(e.argonautas.dono).toBe(cId);
  });

  it('Símbolos de Presságios não contam', () => {
    const cartaComArgo = LENDAS.find((l) => l.argo > 0 && l.nivel === 1)!;
    const base = novaPartida('seed-argo-pressagio', 4);
    const jogadorId = base.jogadores[0]!.id;
    const e = { ...base, fileiras: { ...base.fileiras, 1: [cartaComArgo.id, ...base.fileiras[1].slice(1)] } };

    const r = reduzir(e, {
      tipo: 'RESERVAR',
      jogadorId,
      alvo: { tipo: 'fileira', cartaId: cartaComArgo.id },
    });
    esperarOk(r);
    if (!r.ok) return;

    expect(r.valor.jogadores.find((j) => j.id === jogadorId)!.simbolosArgo).toBe(0);
  });
});
