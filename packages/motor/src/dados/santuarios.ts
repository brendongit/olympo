// GERADO AUTOMATICAMENTE por scripts/gerar-dados.ts a partir de docs/olympos-deck.json.
// Não edite manualmente — rode `pnpm --filter @olympos/motor gerar:dados`.

import type { FaceSantuario } from '../tipos.js';

export const SANTUARIOS: FaceSantuario[] = [
  { id: "SAN-01A", cartao: 1, face: "A", nome: "Partenon", patrono: "Atena", kleos: 3, requisito: { eter: 4, oceano: 0, terra: 4, chama: 0, sombra: 0 } },
  { id: "SAN-01B", cartao: 1, face: "B", nome: "Samos", patrono: "Hera", kleos: 3, requisito: { eter: 3, oceano: 3, terra: 3, chama: 0, sombra: 0 } },
  { id: "SAN-02A", cartao: 2, face: "A", nome: "Corinto", patrono: "Afrodite", kleos: 3, requisito: { eter: 0, oceano: 4, terra: 0, chama: 4, sombra: 0 } },
  { id: "SAN-02B", cartao: 2, face: "B", nome: "Naxos", patrono: "Dionísio", kleos: 3, requisito: { eter: 0, oceano: 3, terra: 3, chama: 3, sombra: 0 } },
  { id: "SAN-03A", cartao: 3, face: "A", nome: "Elêusis", patrono: "Deméter", kleos: 3, requisito: { eter: 0, oceano: 0, terra: 4, chama: 0, sombra: 4 } },
  { id: "SAN-03B", cartao: 3, face: "B", nome: "Tártaro", patrono: "Hades", kleos: 3, requisito: { eter: 0, oceano: 0, terra: 3, chama: 3, sombra: 3 } },
  { id: "SAN-04A", cartao: 4, face: "A", nome: "Lemnos", patrono: "Hefesto", kleos: 3, requisito: { eter: 4, oceano: 0, terra: 0, chama: 4, sombra: 0 } },
  { id: "SAN-04B", cartao: 4, face: "B", nome: "Esparta", patrono: "Ares", kleos: 3, requisito: { eter: 3, oceano: 0, terra: 0, chama: 3, sombra: 3 } },
  { id: "SAN-05A", cartao: 5, face: "A", nome: "Cnossos", patrono: "Poseidon", kleos: 3, requisito: { eter: 0, oceano: 4, terra: 0, chama: 0, sombra: 4 } },
  { id: "SAN-05B", cartao: 5, face: "B", nome: "Éfeso", patrono: "Ártemis", kleos: 3, requisito: { eter: 3, oceano: 3, terra: 0, chama: 0, sombra: 3 } },
  { id: "SAN-06A", cartao: 6, face: "A", nome: "Olimpo", patrono: "Zeus", kleos: 3, requisito: { eter: 2, oceano: 2, terra: 2, chama: 2, sombra: 2 } },
  { id: "SAN-06B", cartao: 6, face: "B", nome: "Delfos", patrono: "Apolo", kleos: 3, requisito: { eter: 2, oceano: 2, terra: 2, chama: 2, sombra: 2 } },
];

export const SANTUARIO_POR_ID: Record<string, FaceSantuario> = Object.fromEntries(
  SANTUARIOS.map((s) => [s.id, s]),
);
