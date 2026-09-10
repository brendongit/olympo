# OLYMPOS

Jogo de tabuleiro online (reskin mitológico de Splendor). React + TS + Vite, monorepo.

## Fonte da verdade

`docs/OLYMPOS-regras-e-spec.md` é a especificação completa. Toda dúvida de regra
se resolve consultando esse arquivo — nunca por suposição. Se algo não estiver
lá, pergunte antes de implementar.

## Regras de arquitetura inegociáveis

- `packages/motor` é puro: sem React, sem rede, sem Math.random, sem Date.now.
  Toda aleatoriedade vem do seed da partida.
- Servidor e cliente importam LITERALMENTE o mesmo pacote motor.
- Nenhuma lógica de regra dentro de componentes React.
- O servidor é autoridade; o cliente nunca decide resultado.
- `verificarInvariantes()` roda após toda ação em dev e em todo teste.

## Estado atual: MIGRAÇÃO DE RULESET EM ANDAMENTO

O motor e a UI foram construídos sobre o Splendor clássico. A spec agora é
o ruleset de Splendor: Marvel. O código está ERRADO até a migração terminar.
O Apêndice C da spec lista as 8 divergências. A fase de rede está PAUSADA.

## Armadilhas (Apêndice C + Seção 13)

- Vitória NÃO é 16 pontos. São 3 condições simultâneas: 16 Kléos + 1 Domínio
  de cada uma das 5 essências + a Essência de Chronos.
- Chronos: ganha na 1ª Lenda nível 3, máx 1, nunca devolvível, nunca paga nada.
- Os Argonautas são itinerantes: 3 Kléos que mudam de dono. Empate mantém o dono.
- Santuários: 6 cartões de dupla face, revela-se nº de jogadores (NÃO N+1).
- O gatilho de fim de jogo PODE SE DESFAZER (Seção 12.4).
- Colher 2 iguais exige pilha >= 4 (não 2).
