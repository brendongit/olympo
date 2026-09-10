// Gera src/dados/lendas.ts e src/dados/santuarios.ts a partir de docs/olympos-deck.json.
// Rodar com: pnpm --filter @olympos/motor gerar:dados

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DECK_JSON = path.resolve(__dirname, '../../../../docs/olympos-deck.json');
const OUT_DIR = path.resolve(__dirname, '../dados');

interface CustoJson {
  eter: number;
  oceano: number;
  terra: number;
  chama: number;
  sombra: number;
}

interface LendaJson {
  id: string;
  nivel: 1 | 2 | 3;
  dominio: string;
  kleos: number;
  custo: CustoJson;
  argo: number;
  chronos: boolean;
  nome: string;
}

interface SantuarioJson {
  id: string;
  cartao: number;
  face: 'A' | 'B';
  nome: string;
  patrono: string;
  kleos: number;
  requisito: CustoJson;
}

interface DeckJson {
  essencias: string[];
  coringa: string;
  especial: string;
  lendas: LendaJson[];
  santuarios: SantuarioJson[];
}

function custoLiteral(c: CustoJson): string {
  return `{ eter: ${c.eter}, oceano: ${c.oceano}, terra: ${c.terra}, chama: ${c.chama}, sombra: ${c.sombra} }`;
}

function stringLiteral(s: string): string {
  return JSON.stringify(s);
}

function main(): void {
  const deck: DeckJson = JSON.parse(readFileSync(DECK_JSON, 'utf-8'));

  if (deck.coringa !== 'icor') {
    throw new Error(`Esperava coringa "icor", encontrei ${JSON.stringify(deck.coringa)}`);
  }
  if (deck.especial !== 'chronos') {
    throw new Error(`Esperava especial "chronos", encontrei ${JSON.stringify(deck.especial)}`);
  }
  if (deck.lendas.length !== 90) {
    throw new Error(`Esperava 90 Lendas, encontrei ${deck.lendas.length}`);
  }
  if (deck.santuarios.length !== 12) {
    throw new Error(`Esperava 12 faces de Santuário, encontrei ${deck.santuarios.length}`);
  }

  const lendasLinhas = deck.lendas.map((l) => {
    return `  { id: ${stringLiteral(l.id)}, nivel: ${l.nivel}, dominio: ${stringLiteral(
      l.dominio,
    )}, kleos: ${l.kleos}, custo: ${custoLiteral(l.custo)}, argo: ${l.argo}, chronos: ${l.chronos}, nome: ${stringLiteral(l.nome)} },`;
  });

  const lendasTs = `// GERADO AUTOMATICAMENTE por scripts/gerar-dados.ts a partir de docs/olympos-deck.json.
// Não edite manualmente — rode \`pnpm --filter @olympos/motor gerar:dados\`.

import type { Lenda } from '../tipos.js';

export const LENDAS: Lenda[] = [
${lendasLinhas.join('\n')}
];

export const LENDA_POR_ID: Record<string, Lenda> = Object.fromEntries(
  LENDAS.map((l) => [l.id, l]),
);
`;

  const santuariosLinhas = deck.santuarios.map((s) => {
    return `  { id: ${stringLiteral(s.id)}, cartao: ${s.cartao}, face: ${stringLiteral(s.face)}, nome: ${stringLiteral(
      s.nome,
    )}, patrono: ${stringLiteral(s.patrono)}, kleos: 3, requisito: ${custoLiteral(s.requisito)} },`;
  });

  const santuariosTs = `// GERADO AUTOMATICAMENTE por scripts/gerar-dados.ts a partir de docs/olympos-deck.json.
// Não edite manualmente — rode \`pnpm --filter @olympos/motor gerar:dados\`.

import type { FaceSantuario } from '../tipos.js';

export const SANTUARIOS: FaceSantuario[] = [
${santuariosLinhas.join('\n')}
];

export const SANTUARIO_POR_ID: Record<string, FaceSantuario> = Object.fromEntries(
  SANTUARIOS.map((s) => [s.id, s]),
);
`;

  writeFileSync(path.join(OUT_DIR, 'lendas.ts'), lendasTs);
  writeFileSync(path.join(OUT_DIR, 'santuarios.ts'), santuariosTs);

  console.log(`Gerado: ${deck.lendas.length} Lendas, ${deck.santuarios.length} faces de Santuário.`);
}

main();
