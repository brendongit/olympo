# OLYMPOS

Um jogo de tabuleiro de coleta e ascensão, ambientado na mitologia grega —
para 2 a 4 jogadores, jogável no navegador, sozinho no mesmo dispositivo ou
online com amigos.

> Mecanicamente, OLYMPOS é um reskin do ruleset de **Splendor: Marvel**: o
> mesmo esqueleto de "colha recursos, reivindique cartas, acumule pontos",
> vestido em mitologia grega — e com uma condição de vitória bem menos trivial
> do que "chegue a 15 pontos primeiro".

---

## O jogo

Você é um herói em ascensão ao Olimpo. Em cada turno, escolhe **uma** entre
quatro ações: colher essências do reservatório central, reivindicar uma
**Lenda** (uma carta com um bônus permanente e pontos de **Kléos**), ou
reservar um Presságio para mais tarde.

As cinco essências — **Éter, Oceano, Terra, Chama e Sombra** — são a moeda do
jogo. Cada Lenda reivindicada concede um **Domínio** permanente numa dessas
essências, que passa a funcionar como desconto em todas as compras futuras.

### O Keraunos — a condição de vitória

Não basta acumular pontos. Para forjar o Keraunos e vencer a partida, é
preciso cumprir **três condições ao mesmo tempo**:

| Requisito | O quê |
|---|---|
| **16 Kléos** | Pontos de glória, somados de Lendas, Santuários e d'Os Argonautas |
| **1 Domínio de cada essência** | Éter, Oceano, Terra, Chama **e** Sombra — todas as cinco |
| **A Essência de Chronos** | Obtida só ao reivindicar a primeira Lenda de nível 3 — as mais caras do jogo |

Um jogador com 25 Kléos e nenhum Domínio de Sombra não venceu nada. É por
isso que a partida raramente termina exatamente como todo mundo previa.

### O que mais diverge do Splendor clássico

- **Os Argonautas** — uma carta de 3 Kléos que muda de dono ao longo da
  partida: quem acumular mais Símbolos do Argo (mínimo 3) a toma para si. Dá
  pra estar com 17 Kléos e cair pra 14 sem fazer nada, só porque foi a vez de
  outro jogador.
- **Santuários** — 6 cartões de dupla face (12 faces possíveis), dos quais
  só `nº de jogadores` entram em cada partida. Recompensam Domínios, não
  fichas.
- **O gatilho de fim de jogo pode se desfazer.** Se quem disparou a última
  rodada perder Os Argonautas e cair abaixo de 16 Kléos, e ninguém mais
  qualificar, o jogo simplesmente continua.

A especificação completa — regras, casos de borda, dataset e arquitetura
técnica — vive em [`docs/OLYMPOS-regras-e-spec.md`](docs/OLYMPOS-regras-e-spec.md).
É a fonte da verdade do projeto: toda dúvida de regra se resolve ali, nunca
por suposição.

---

## Stack

| Camada | Escolha |
|---|---|
| Front | React + TypeScript + Vite |
| Estilo | Tailwind CSS |
| Estado | Zustand |
| Transporte | Socket.IO |
| Servidor | Node + TypeScript |
| Motor de regras | TypeScript puro — sem React, sem rede, sem `Math.random` |
| Deploy | Render, plano gratuito |

## Estrutura do monorepo

```
packages/
  motor/      pacote puro com as regras do jogo — sem React, sem rede.
              É a fonte da verdade em código: servidor e cliente importam
              literalmente o mesmo pacote.
  web/        interface React (hotseat local; modo online em construção).
  servidor/   servidor Node + Socket.IO, autoridade sobre o estado da
              partida quando o jogo é online.
docs/
  OLYMPOS-regras-e-spec.md   especificação completa do jogo.
  olympos-deck.json          dataset das Lendas e Santuários, fonte para o
                              gerador em packages/motor/src/scripts.
```

## Como rodar localmente

Requer [pnpm](https://pnpm.io) e Node ≥ 18.

```bash
pnpm install

# motor: testes e verificação de tipos
pnpm --filter @olympos/motor test
pnpm --filter @olympos/motor typecheck

# interface (hotseat local, em http://localhost:5173)
pnpm --filter @olympos/web dev

# servidor (saguão + WebSocket, em http://localhost:3001)
pnpm --filter @olympos/servidor dev
```

Rodar tudo de uma vez, na raiz:

```bash
pnpm test        # testes de todos os pacotes
pnpm typecheck    # verificação de tipos de todos os pacotes
```

## Estado do projeto

- **`packages/motor`** — migrado para o ruleset de Splendor: Marvel.
  Typecheck limpo, suíte de testes completa (incluindo fuzz de invariantes
  contra centenas de turnos aleatórios).
- **`packages/web`** — ainda roda hotseat local sobre o ruleset clássico
  (Splendor original). A migração da interface para o ruleset novo — trocar
  "Deuses"/Favor Divino por Santuários, adicionar Os Argonautas e a Essência
  de Chronos na UI — está em andamento.
- **`packages/servidor`** — esqueleto mínimo: `GET /health`, CORS, e um
  saguão (`sala:criar`/`sala:entrar`) com limpeza automática de salas vazias.
  O protocolo completo de jogo em rede (ações, reconciliação, reconexão)
  ainda não foi implementado.

## Deploy

O alvo é o [Render](https://render.com), plano gratuito — ver
`render.yaml` na raiz e a Seção 17.7 da especificação para as decisões de
arquitetura por trás disso (sem Redis/Postgres, salas em memória, tela de
despertar para lidar com o serviço hibernando por inatividade).
# olympo
