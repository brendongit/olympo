// Código de sala de 6 caracteres, formato "OLY-4K2" (Seção 17.2).
// Alfabeto sem caracteres ambíguos (sem 0/O, 1/I).

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function gerarCodigoDeSala(aleatorio: () => number = Math.random): string {
  let sufixo = '';
  for (let i = 0; i < 3; i++) {
    sufixo += ALFABETO[Math.floor(aleatorio() * ALFABETO.length)];
  }
  return `OLY-${sufixo}`;
}
