# OLYMPOS — Especificação Completa do Jogo

> **Versão 2.0** — alinhada ao ruleset de *Splendor: Marvel* (Space Cowboys / Galápagos).
>
> **Documento de referência para implementação.** Contém 100% das regras, o dataset completo, a especificação técnica (estado, validação, protocolo online) e as diretrizes de UI responsiva.
>
> **Público-alvo:** este arquivo é a fonte da verdade para o Claude Code. Toda regra ambígua deve ser resolvida consultando este documento, nunca por suposição.

> ⚠️ **Leia o Apêndice C antes de mais nada se você conhece o Splendor clássico.** O ruleset aqui é o de *Splendor: Marvel*, que difere do Splendor base em pontos estruturais — condição de vitória, sexta ficha, carta itinerante e contagem de nobres. Implementar "de cabeça" a partir do Splendor clássico produz um jogo errado.

---

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Camada temática — o glossário](#2-camada-temática--o-glossário)
3. [Componentes](#3-componentes)
4. [Preparação da partida](#4-preparação-da-partida)
5. [Objetivo — O Keraunos](#5-objetivo--o-keraunos)
6. [Anatomia de uma carta](#6-anatomia-de-uma-carta)
7. [O turno — as quatro ações](#7-o-turno--as-quatro-ações)
8. [Limite de 10 fichas](#8-limite-de-10-fichas)
9. [A Essência de Chronos](#9-a-essência-de-chronos)
10. [Os Santuários](#10-os-santuários)
11. [A carta Os Argonautas](#11-a-carta-os-argonautas)
12. [Fim de jogo, pontuação e desempate](#12-fim-de-jogo-pontuação-e-desempate)
13. [Casos de borda — tabela de arbitragem](#13-casos-de-borda--tabela-de-arbitragem)
14. [Dataset completo](#14-dataset-completo)
15. [Especificação técnica — modelo de estado](#15-especificação-técnica--modelo-de-estado)
16. [Validação e resolução de ações](#16-validação-e-resolução-de-ações)
17. [Protocolo online real-time](#17-protocolo-online-real-time)
18. [Informação pública vs. privada](#18-informação-pública-vs-privada)
19. [UI/UX responsiva](#19-uiux-responsiva)
20. [Acessibilidade](#20-acessibilidade)
21. [Stack sugerida e roteiro de implementação](#21-stack-sugerida-e-roteiro-de-implementação)
22. [Suíte de testes obrigatória](#22-suíte-de-testes-obrigatória)

---

## 1. Visão geral

**OLYMPOS** é um jogo de construção de motor (*engine building*) e gestão de recursos para **2 a 4 jogadores**, jogado em navegador (desktop e mobile), em salas online em tempo real.

Os jogadores são heróis em ascensão que reúnem **Essências Primordiais** para reivindicar **Lendas** (cartas). Cada Lenda concede um **Domínio permanente** — um desconto que barateia as Lendas seguintes. Lendas poderosas valem **Kléos** (glória). Domínios suficientes atraem o favor de um **Santuário**; heróis lendários suficientes garantem a posse d'**Os Argonautas**.

**A partida termina quando um jogador forja o Keraunos — o Raio de Zeus.** Para isso ele precisa, ao mesmo tempo:

| | Requisito |
|---|---|
| ⚡ | **16 Kléos** ou mais |
| 🜲 | **Ao menos 1 Domínio de cada uma das 5 essências** |
| ⧗ | **A Essência de Chronos** |

Os três, simultaneamente. Pontos sozinhos não vencem o jogo.

| Característica | Valor |
|---|---|
| Jogadores | 2, 3 ou 4 |
| Duração típica | 30–45 minutos |
| Duração de turno | 5–20 segundos |
| Informação | Quase totalmente aberta (exceto Presságios do topo do baralho) |
| Aleatoriedade | Ordem dos baralhos e sorteio dos Santuários |
| Interação | Indireta (disputa por essências e cartas) + direta (roubo d'Os Argonautas) |

### Princípio de design que não pode ser quebrado

O turno é **curto e atômico**: o jogador realiza **exatamente uma ação principal**, os efeitos automáticos se resolvem, e o turno passa. Qualquer UI que exija mais de 2 toques para a ação mais comum está errada.

---

## 2. Camada temática — o glossário

A mecânica é a de *Splendor: Marvel*; a camada temática abaixo é o vocabulário oficial do jogo. **Use estes termos na UI, no código e nas mensagens.**

| Papel mecânico | Termo do jogo | Identidade visual |
|---|---|---|
| Ficha de recurso 1 | **Éter** | Branco-pérola / dourado pálido. Luz do Olimpo, raios, nuvens. |
| Ficha de recurso 2 | **Oceano** | Azul-profundo. Ondas, conchas, tridentes. |
| Ficha de recurso 3 | **Terra** | Verde-oliva. Oliveira, trigo, videira. |
| Ficha de recurso 4 | **Chama** | Vermelho-brasa. Forja, fogo, bronze aquecido. |
| Ficha de recurso 5 | **Sombra** | Preto-obsidiana com brilho roxo. Submundo, asfódelos, névoa. |
| Ficha coringa | **Ícor** | Dourado líquido. O sangue dos deuses — substitui qualquer essência. |
| Sexta ficha, especial | **Essência de Chronos** | Ampulheta de bronze. Cinza-esverdeado. Não se compra, não se devolve. |
| Carta de desenvolvimento | **Lenda** | — |
| Bônus permanente | **Domínio** | Ícone da essência gravado na carta. |
| Ponto de prestígio | **Kléos** (glória) | Coroa de louros. |
| Carta reservada | **Presságio** | Carta guardada na mão do herói. |
| Nobre / Local | **Santuário** | Cartão de dupla face, cada face com um deus patrono. |
| Símbolo de equipe na carta | **Símbolo do Argo** ⛵ | Vela do navio Argo, no canto da carta. |
| Carta itinerante de 3 pontos | **Os Argonautas** | Muda de dono ao longo da partida. |
| Artefato de vitória | **O Keraunos** | O Raio de Zeus, forjado pelos Ciclopes. |
| Baralho nível 1 | **Relíquias e Presságios** | Bronze |
| Baralho nível 2 | **Heróis e Criaturas** | Prata |
| Baralho nível 3 | **Titãs e Primordiais** | Ouro — **todas trazem a Marca de Chronos** |

**Ordem canônica das essências** (use sempre esta ordem em toda a UI e em todo array):
`éter → oceano → terra → chama → sombra → ícor → chronos`

---

## 3. Componentes

### 3.1 Fichas

| Ficha | Total | Obtida como? |
|---|---|---|
| Éter | 7 | Ações A e B |
| Oceano | 7 | Ações A e B |
| Terra | 7 | Ações A e B |
| Chama | 7 | Ações A e B |
| Sombra | 7 | Ações A e B |
| **Ícor** (coringa) | **5** | **Somente reservando um Presságio** |
| **Chronos** (especial) | **4** | **Somente ao reivindicar a 1ª Lenda de nível 3** |
| **Total** | **44** | |

> ⚠️ **Ícor e Chronos nunca podem ser pegos pelas Ações A ou B.** São as duas fichas "fora do mercado".

A quantidade **inicial em jogo** de essências e de Chronos varia com o número de jogadores (Seção 4). O **Ícor é sempre 5**, em qualquer configuração.

### 3.2 Lendas (cartas)

| Nível | Baralho | Qtd. | Kléos | Custo total | Marca de Chronos |
|---|---|---|---|---|---|
| 1 | Relíquias e Presságios | **40** | 0 ou 1 | 3 a 5 | não |
| 2 | Heróis e Criaturas | **30** | 1, 2 ou 3 | 5 a 8 | não |
| 3 | Titãs e Primordiais | **20** | 3, 4 ou 5 | 7 a 14 | **todas** |
| | **Total** | **90** | | | |

Cada nível tem exatamente **8 / 6 / 4 cartas por Domínio**, totalizando 18 por Domínio.

**Símbolos do Argo:** 30 das 90 Lendas trazem símbolo — 6 por Domínio, somando **7 símbolos por Domínio** e **35 no baralho inteiro**.

### 3.3 Santuários

**6 cartões de dupla face = 12 faces possíveis.** Cada face tem um nome, um deus patrono, um requisito de Domínios e vale **3 Kléos**.

### 3.4 Cartas únicas

- **1 cartão d'Os Argonautas** — vale 3 Kléos, itinerante.
- **1 cartão do Keraunos** — marcador da condição de vitória, não vale pontos.

### 3.5 Contabilidade de Kléos

| Fonte | Kléos disponíveis |
|---|---|
| Lendas nível 1 | 5 |
| Lendas nível 2 | 55 |
| Lendas nível 3 | 80 |
| Santuários em jogo | 3 × nº de jogadores |
| Os Argonautas | 3 |
| **Total (4 jogadores)** | **158** |

---

## 4. Preparação da partida

Execute nesta ordem exata:

1. **Separe os três baralhos** por nível, embaralhe cada um separadamente e disponha-os em coluna — nível 3 no topo, nível 1 na base.

2. **Revele 4 Lendas de cada nível**, à direita do baralho correspondente. São 12 Lendas visíveis.

3. **Sorteie Santuários em quantidade igual ao número de jogadores.** Para cada cartão sorteado, **escolha aleatoriamente qual das duas faces fica virada para cima**. Os cartões não sorteados saem da partida.

   > ⚠️ São `nº de jogadores` Santuários — **não** `nº de jogadores + 1`.

4. **Coloque o cartão do Keraunos e o cartão d'Os Argonautas** acima dos Santuários. Ninguém começa com Os Argonautas.

5. **Coloque as fichas de Ícor** ao lado dos Santuários, e a pilha de **Chronos** junto ao cartão do Keraunos.

6. **Coloque as 5 pilhas de essências** ao alcance de todos.

### Quantidades por número de jogadores

| Jogadores | Cada essência | Chronos | Ícor | Santuários |
|---|---|---|---|---|
| **2** | 4 | **2** | **5** | **2** |
| **3** | 5 | **3** | **5** | **3** |
| **4** | 7 | **4** | **5** | **4** |

Fichas fora de jogo não existem para efeito de regra — nunca retornam.

7. **Cada jogador começa com:** 0 fichas, 0 Lendas, 0 Presságios, 0 Kléos, 0 símbolos do Argo.

8. **O jogador inicial é sorteado.** A ordem de turno é fixa e horária durante toda a partida.

---

## 5. Objetivo — O Keraunos

Não basta pontuar. Para forjar o Keraunos e disparar o fim do jogo, um jogador precisa cumprir **os três requisitos ao mesmo tempo**, verificados ao final do seu turno:

```
kleos >= 16
  E  dominios[e] >= 1  para TODA essência e (éter, oceano, terra, chama, sombra)
  E  temChronos == true
```

**Consequências de design que a UI precisa comunicar:**

- Um jogador com 20 Kléos mas sem nenhum Domínio de Sombra **não venceu nada**.
- A Essência de Chronos exige reivindicar ao menos uma Lenda de nível 3 — as mais caras do jogo. Ninguém vence só com cartas baratas.
- Como Os Argonautas valem 3 Kléos e **mudam de dono**, um jogador pode cair de 16 para 13 Kléos sem fazer nada. Isso tem consequência direta no fim do jogo (Seção 12).

**A UI deve exibir permanentemente um painel de progresso do Keraunos**, com os três requisitos e o estado de cada um. Ver Seção 19.5.

---

## 6. Anatomia de uma carta

Toda Lenda tem seis atributos:

| Atributo | Descrição |
|---|---|
| **Nível** | 1, 2 ou 3. Define o baralho e o dorso. |
| **Domínio** | Uma das 5 essências. Bônus permanente. Toda carta tem exatamente **um** Domínio de **uma unidade**. |
| **Kléos** | 0 a 5 pontos de glória. |
| **Custo** | De 0 a 7 unidades de cada essência. **Nunca inclui Ícor nem Chronos.** |
| **Símbolos do Argo** | 0, 1 ou 2. Contam para a posse d'Os Argonautas (Seção 11). |
| **Marca de Chronos** | Presente em **todas** as cartas de nível 3 e em nenhuma outra. |

> **Regra fundamental do motor:** o Domínio é permanente e funciona como **desconto**, não como ficha. Reduz o custo de todas as compras futuras, mas **nunca é gasto, dado ou perdido**, e **não conta** para o limite de 10 fichas.
>
> **Não existe Domínio de Chronos.** A Essência de Chronos nunca é gasta para reivindicar nada.

---

## 7. O turno — as quatro ações

No seu turno, o jogador escolhe **exatamente uma** das quatro ações. Não é possível passar voluntariamente, exceto no caso de 7.5.

### 7.1 Ação A — Colher 3 essências diferentes

Pegue **1 ficha de 3 pilhas de essências diferentes**.

**Condições:**
- As 3 devem ser de tipos diferentes.
- **Não é possível pegar Ícor nem Chronos com esta ação.**
- Cada pilha escolhida deve ter **pelo menos 1 ficha**.
- Se houver **menos de 3 tipos** de essência disponíveis, o jogador pega **quantos tipos existirem** (2, 1 ou 0).

### 7.2 Ação B — Colher 2 essências iguais

Pegue **2 fichas do mesmo tipo**.

**Condições:**
- A pilha deve ter **pelo menos 4 fichas no momento em que a ação começa**. Com 3 ou menos, a ação é ilegal para aquela pilha.
- **Não é possível pegar Ícor nem Chronos com esta ação.**
- Não existe "pegar 1 do mesmo tipo" como variante.

> ⚠️ Erro clássico: verificar `pilha >= 2`. O correto é **`pilha >= 4`**.

### 7.3 Ação C — Reivindicar uma Lenda

Pague o custo e adicione a Lenda ao seu tabuleiro pessoal.

**Alvos válidos:**
- Qualquer uma das **12 Lendas visíveis**.
- Qualquer um dos seus próprios **Presságios**.

**Cálculo do pagamento — algoritmo exato:**

Para cada essência `e`:

```
faltante(e)       = max(0, custo(e) − dominios(e))
pagoEmEssência(e) = min(fichas(e), faltante(e))
pagoEmÍcor(e)     = faltante(e) − pagoEmEssência(e)
```

A jogada é legal se e somente se:

```
Σ pagoEmÍcor(e)  ≤  fichas(ícor)
```

Todas as fichas pagas (inclusive Ícor) **voltam ao reservatório central** e ficam imediatamente disponíveis.

**Regras de pagamento:**
- O desconto do Domínio é **sempre aplicado primeiro e obrigatoriamente**.
- O jogador **deve** usar as essências coloridas antes de recorrer ao Ícor. Não é permitido gastar Ícor voluntariamente quando há a essência correspondente. O cálculo é determinístico.
- **A Essência de Chronos nunca entra no pagamento.** Não é gasta, não é oferecida, não aparece na tela de pagamento.
- Custo integralmente coberto por Domínios ⇒ reivindicação **gratuita**.

**Reposição:**
- Lenda vinda de uma fileira visível é **imediatamente substituída** pelo topo daquele baralho.
- Baralho vazio ⇒ o espaço fica **permanentemente vazio**. O jogo continua.
- Lenda vinda de um Presságio ⇒ **nada é reposto**.

**Efeitos imediatos:**
1. +1 Domínio permanente na essência da carta.
2. +Kléos da carta.
3. +símbolos do Argo da carta.
4. **Se a carta for de nível 3 e o jogador ainda não tiver a Essência de Chronos, ele pega 1 ficha de Chronos agora** (Seção 9).

### 7.4 Ação D — Reservar um Presságio

Guarde uma Lenda na mão e ganhe 1 Ícor.

**Condições:**
- Máximo de **3 Presságios** na mão. Com 3, a ação é ilegal.

**Alvos válidos:**
- Qualquer uma das **12 Lendas visíveis**.
- A **carta do topo de qualquer um dos três baralhos**, sem olhá-la.

**Efeito:**
- A carta vai para a mão.
- O jogador ganha **1 Ícor, se houver Ícor disponível**. **Sem Ícor no reservatório, a reserva continua legal — o jogador simplesmente não recebe nada.**
- Carta vinda de fileira visível ⇒ **reposta imediatamente**. Carta vinda do topo do baralho ⇒ **nada é reposto**.

> **Reservar é a única forma de obter Ícor.** Não há penalidade por terminar a partida com Presságios não reivindicados, e um Presságio **não pode ser descartado** — a única saída da mão é reivindicando.

**Visibilidade:**
- Presságio reservado **de uma fileira visível**: identidade **pública**.
- Presságio reservado **do topo do baralho**: identidade **privada**. Os oponentes veem apenas "1 presságio oculto (nível N)". O servidor **jamais** envia a identidade aos outros clientes.

### 7.5 Turno sem ação legal

Se, no início do turno, não houver **nenhuma** ação legal (reservatório sem essências e sem Ícor, 3 Presságios na mão, nenhuma Lenda reivindicável), o jogador **passa**. É o único caso em que passar é permitido, e a UI deve informar o motivo explicitamente.

---

## 8. Limite de 10 fichas

**Ao final do seu turno, um jogador não pode ter mais de 10 fichas no total** — somando as 5 essências, o Ícor **e a Essência de Chronos**.

- Domínios **não contam** para este limite.
- Excedendo 10, o jogador **devolve fichas ao reservatório** até ficar com exatamente 10, escolhendo quais.
- **A Essência de Chronos nunca pode ser devolvida.** Ela ocupa um dos 10 espaços permanentemente. O seletor de descarte deve exibi-la travada, com o motivo.
- A devolução é **etapa obrigatória do mesmo turno**, não uma ação separada. O turno só passa depois dela.
- Durante o turno o jogador pode ter qualquer número de fichas; o limite só vale no **fim do turno**.
- **Não é permitido recusar fichas para evitar a devolução.** Com 9 fichas e a Ação A, ele pega as 3 e devolve 2.

**Consequência para a UI:** após uma colheita que estoure o limite, o jogo entra no sub-estado `DESCARTANDO`. A interface bloqueia o fim do turno e apresenta um seletor com contador ao vivo `12 → 10`, com a ficha de Chronos visivelmente travada.

---

## 9. A Essência de Chronos

A sexta ficha é o gargalo do jogo. Sem ela ninguém vence.

**Como se obtém:**
- **Ao reivindicar a sua primeira Lenda de nível 3.** Todas as cartas de nível 3 — e somente elas — trazem a Marca de Chronos.
- O ganho é **imediato**, dentro da própria Ação C, e não conta como ação.

**Regras:**
- **Máximo de 1 Essência de Chronos por jogador**, para sempre. Reivindicar a segunda, terceira ou décima Lenda de nível 3 não dá nada.
- **Nunca pode ser devolvida** ao reservatório, nem no descarte do limite de 10.
- **Nunca é gasta** para reivindicar Lendas.
- **Não gera Domínio.** Não existe "Domínio de Chronos".
- **Não pode ser pega** pelas Ações A ou B.
- Não é possível perdê-la nem transferi-la.

**Nota de balanceamento:** as fichas de Chronos em jogo (`nº de jogadores`) sempre bastam para todos. Ela nunca é um recurso escasso disputado — é um **marco de progresso**, não uma corrida.

---

## 10. Os Santuários

**A verificação de Santuários acontece automaticamente ao final de cada turno**, depois de resolvida a ação, a devolução de fichas e a transferência d'Os Argonautas.

**Regras:**
- Um Santuário se une ao jogador quando os **Domínios** dele atingem ou superam **todos** os requisitos daquela face.
- **Domínios, nunca fichas.**
- Não é uma ação e não custa nada. É automático e **obrigatório** — não se pode recusar.
- **No máximo 1 Santuário por turno.** Qualificando para dois ou mais no mesmo turno, o jogador **escolhe qual**; os outros continuam disponíveis para turnos futuros.
- Vale **3 Kléos** e sai permanentemente da oferta.
- Nunca troca de dono. Uma vez recebido, é definitivo.
- Como Domínios nunca diminuem, uma vez qualificado o jogador permanece qualificado.
- **Não é necessário ter Santuário algum para vencer.**

**Sub-estado `ESCOLHENDO_SANTUARIO`:** com dois ou mais elegíveis no mesmo turno, o motor aguarda a escolha antes de encerrar o turno. Se o cliente não responder dentro do timer, o servidor escolhe o **primeiro na ordem de exibição**.

### As 12 faces

Cada um dos 6 cartões tem duas faces; apenas uma fica visível na partida. Os cartões I a V opõem um Santuário **focado** (4+4, especialização) a um Santuário **amplo** (3+3+3). O cartão VI traz duas faces de mesma dificuldade (2 de cada essência) — a escolha ali é de patrono, não de estratégia, e ele recompensa exatamente a diversificação que o Keraunos já exige.

| Cartão | Face A | Requisito | Face B | Requisito |
|---|---|---|---|---|
| **I** | **Partenon** (Atena) | 4 Éter + 4 Terra | **Samos** (Hera) | 3 Éter + 3 Oceano + 3 Terra |
| **II** | **Corinto** (Afrodite) | 4 Oceano + 4 Chama | **Naxos** (Dionísio) | 3 Oceano + 3 Terra + 3 Chama |
| **III** | **Elêusis** (Deméter) | 4 Terra + 4 Sombra | **Tártaro** (Hades) | 3 Terra + 3 Chama + 3 Sombra |
| **IV** | **Lemnos** (Hefesto) | 4 Chama + 4 Éter | **Esparta** (Ares) | 3 Chama + 3 Sombra + 3 Éter |
| **V** | **Cnossos** (Poseidon) | 4 Sombra + 4 Oceano | **Éfeso** (Ártemis) | 3 Sombra + 3 Éter + 3 Oceano |
| **VI** | **Olimpo** (Zeus) | 2 de cada essência | **Delfos** (Apolo) | 2 de cada essência |

---

## 11. A carta Os Argonautas

Vale **3 Kléos** e é a única fonte de interação direta do jogo: ela **muda de dono**.

**Como funciona:**
- 30 Lendas trazem **1 ou 2 Símbolos do Argo** ⛵. O total de símbolos de um jogador é a soma dos símbolos das Lendas que ele **reivindicou** (Presságios não contam).
- O **primeiro** jogador a acumular **3 ou mais símbolos** recebe a carta automaticamente.
- Depois disso, **qualquer jogador que passe a ter estritamente mais símbolos que o dono atual toma a carta para si**, junto com os 3 Kléos.
- **Empate mantém o dono atual.** Igualar não é suficiente; é preciso superar.
- A carta pode trocar de mãos **várias vezes** na mesma partida.
- Tomar a carta **não é uma ação** e não custa nada. É automático e obrigatório.
- **Não é necessário estar com Os Argonautas para vencer.**

**Verificação:** ao final de cada turno, após o descarte e **antes** da verificação de Santuários.

```ts
function verificarArgonautas(e: EstadoJogo, jogadorId: string): EstadoJogo {
  const j = jogador(e, jogadorId);
  const donoAtual = e.argonautas.dono;
  const simbolosDono = donoAtual ? jogador(e, donoAtual).simbolosArgo : 0;

  if (j.simbolosArgo < 3) return e;                 // limiar mínimo
  if (donoAtual === j.id) return e;                 // já é dele
  if (donoAtual !== null && j.simbolosArgo <= simbolosDono) return e;  // empate mantém

  return { ...e, argonautas: { dono: j.id } };      // toma a carta
}
```

> ⚠️ Os 3 Kléos d'Os Argonautas são **voláteis**. Ao recalcular `kleos`, some 3 apenas ao dono do momento. Um jogador pode cair de 17 para 14 Kléos no turno de um adversário, sem ter feito nada — e isso pode desfazer o gatilho de fim de jogo (Seção 12.4).

---

## 12. Fim de jogo, pontuação e desempate

### 12.1 O gatilho

Ao final de qualquer turno, se o jogador da vez cumprir **os três requisitos do Keraunos** (Seção 5), a partida entra em `ULTIMA_RODADA`.

### 12.2 Encerramento imediato

**Se o jogador que disparou o gatilho for o último da ordem de turno da rodada, o jogo acaba imediatamente** — todos já jogaram o mesmo número de turnos. Não há rodada extra.

### 12.3 Completar a rodada

Caso contrário, a rodada corrente é completada: todos os jogadores que ainda não jogaram naquela volta jogam normalmente, com todos os efeitos valendo. Depois que o **último jogador da ordem** terminar, a partida é avaliada.

### 12.4 Regra especial — o gatilho pode se desfazer

No fim da rodada final, o motor **reavalia todos os jogadores** contra os requisitos do Keraunos.

- **Um ou mais qualificam** ⇒ o jogo acaba. O vencedor sai de entre os qualificados.
- **Nenhum qualifica** ⇒ **o jogo continua**. A flag de última rodada é limpa e a partida prossegue normalmente.

Isso não é teórico: quem disparou o gatilho com exatamente 16 Kléos e perdeu Os Argonautas para um adversário durante a rodada final cai para 13 e deixa de qualificar. Se ninguém mais qualificar, o jogo segue.

### 12.5 Determinação do vencedor

Entre os jogadores que cumprem os requisitos do Keraunos, nesta ordem:

1. **Mais Kléos.**
2. Empate ⇒ quem estiver com **Os Argonautas** vence.
3. Empate persistindo ⇒ **menos Lendas reivindicadas**. Presságios não contam.
4. Empate ainda ⇒ **vitória compartilhada**.

> ⚠️ Jogadores que **não** cumprem os requisitos do Keraunos **não entram no ranking de vitória**, por mais Kléos que tenham. Um jogador com 25 Kléos e nenhum Domínio de Sombra perde para um com 16 Kléos completo.

```ts
function kleosDe(e: EstadoJogo, j: Jogador): number {
  return somaKleosDasLendas(j)
       + 3 * j.santuarios.length
       + (e.argonautas.dono === j.id ? 3 : 0);
}

function cumpreKeraunos(e: EstadoJogo, j: Jogador): boolean {
  return kleosDe(e, j) >= KLEOS_KERAUNOS               // 16
      && ESSENCIAS.every(x => j.dominios[x] >= 1)      // 1 de cada
      && j.temChronos;                                  // essência de Chronos
}
```

---

## 13. Casos de borda — tabela de arbitragem

Esta tabela existe para eliminar toda ambiguidade. **Implemente exatamente assim.**

| # | Situação | Resolução |
|---|---|---|
| 1 | Pilha de essência com exatamente 3 fichas | Ação B **ilegal**. Ação A pode usar a pilha normalmente. |
| 2 | Só existem 2 tipos de essência no reservatório | Ação A pega 2 fichas. |
| 3 | Só existe 1 tipo, com 5 fichas | Ação A pega 1. Ação B pega 2. Ambas legais. |
| 4 | Reservatório de Ícor vazio | Ação D **continua legal**, sem ganho de ficha. |
| 5 | Jogador com 3 Presságios | Ação D **ilegal**. As demais permanecem. |
| 6 | Jogador com 10 fichas usa Ação A | Pega 3, fica com 13, devolve 3. Obrigatório. |
| 7 | Jogador com Chronos precisa devolver 3 fichas e só tem 3 essências + Chronos | Devolve as 3 essências. **Chronos nunca sai.** |
| 8 | Jogador tenta devolver a ficha de Chronos | **Rejeitado.** A UI exibe a ficha travada com o motivo. |
| 9 | Jogador reivindica a 2ª Lenda de nível 3 | **Não ganha** outra ficha de Chronos. Máximo 1 por jogador. |
| 10 | Jogador reivindica um Presságio de nível 3 que reservou às cegas | Ganha Chronos normalmente, se ainda não tiver. A origem não importa. |
| 11 | Pilha de Chronos vazia e jogador reivindica sua 1ª Lenda de nível 3 | Não recebe. (Impossível no jogo base: há 1 ficha por jogador.) |
| 12 | Baralho de nível 2 esgotado e um espaço da fileira é comprado | O espaço fica **vazio permanentemente**. Não puxa de outro nível. |
| 13 | Todos os baralhos esgotados e fileiras vazias | O jogo continua; só é possível colher e reivindicar Presságios. Se ninguém cumprir o Keraunos e **nenhum jogador tiver ação legal por uma rodada inteira**, a partida acaba: vence quem cumprir o Keraunos; se ninguém cumprir, vence quem tiver mais Kléos. |
| 14 | Jogador qualifica para 2 Santuários no mesmo turno | Escolhe 1. O outro continua disponível. |
| 15 | Dois jogadores qualificam para o mesmo Santuário | Recebe quem **terminar o turno primeiro**. Não há conflito simultâneo. |
| 16 | Jogador chega a 3 símbolos do Argo, dono atual tem 3 | **Empate mantém o dono.** É preciso superar. |
| 17 | Jogador chega a 5 símbolos, dono atual tem 4 | Toma a carta e os 3 Kléos imediatamente, ao fim do turno. |
| 18 | Jogador tem 2 símbolos e ninguém tem a carta | Ninguém recebe. O limiar mínimo é 3. |
| 19 | Jogador com 16 Kléos, 1 Domínio de cada, sem Chronos | **Não dispara** o fim do jogo. |
| 20 | Jogador com 20 Kléos, Chronos, mas 0 Domínios de Sombra | **Não dispara** e **não pode vencer**. |
| 21 | Gatilho disparado; durante a rodada final o disparador perde Os Argonautas e cai para 13 | Ao fim da rodada, se ninguém qualificar, **o jogo continua**. |
| 22 | O último jogador da ordem dispara o gatilho | Jogo acaba **imediatamente**, sem rodada extra. |
| 23 | Dois jogadores qualificam ao fim da rodada final, empatados em Kléos | Vence quem tiver Os Argonautas. Se nenhum tiver, menos Lendas. Se persistir, vitória compartilhada. |
| 24 | Custo totalmente coberto por Domínios | Reivindicação **gratuita**. Legal e comum no fim da partida. |
| 25 | Jogador tem Ícor mas também tem a essência colorida | O motor **obriga** o uso da essência colorida primeiro. |
| 26 | Jogador tenta pegar 2 iguais + 1 diferente | **Ilegal.** Ações A e B são mutuamente exclusivas. |
| 27 | Jogador tenta pegar 1 Ícor ou 1 Chronos com a Ação A | **Ilegal.** Nenhuma das duas entra nas Ações A e B. |
| 28 | Jogador tenta descartar um Presságio | **Ilegal.** A única saída da mão é reivindicando. |
| 29 | Reivindicar Presságio de nível 3 com o baralho 3 vazio | Legal. Presságio é independente do baralho. |
| 30 | Jogador desconecta no meio do turno | Ver Seção 17.6 (timeout e ação automática). |

---

## 14. Dataset completo

### 14.1 Como este baralho foi construído

O baralho segue **simetria rotacional perfeita**: as 5 essências formam o ciclo

```
éter → oceano → terra → chama → sombra → éter
```

e cada essência recebe o **mesmo conjunto de formas de custo**, rotacionado. Por construção:

- cada essência é exigida **117 vezes** no baralho inteiro;
- cada Domínio oferece **28 Kléos** em cartas;
- cada Domínio carrega **7 Símbolos do Argo**, em 6 cartas;
- cada essência é exigida **21 vezes** nas 12 faces de Santuário.

Nenhuma cor é melhor que outra. **Ao adicionar ou remover cartas, mantenha a simetria** ou o balanceamento quebra.

### 14.2 Formas de custo por nível

Notação: `(próprio, +1, +2, +3, +4)` — posições relativas no ciclo, a partir do Domínio da própria carta. A coluna ⛵ indica os Símbolos do Argo daquela forma.

**Nível 1 — 8 formas × 5 Domínios = 40 cartas** · sem Marca de Chronos

| Forma | Custo relativo | Kléos | ⛵ | Total |
|---|---|---|---|---|
| 1 | (0, 1, 1, 1, 1) | 0 | — | 4 |
| 2 | (0, 1, 2, 1, 1) | 0 | **1** | 5 |
| 3 | (0, 2, 2, 0, 1) | 0 | — | 5 |
| 4 | (1, 0, 0, 1, 3) | 0 | — | 5 |
| 5 | (0, 0, 0, 2, 1) | 0 | — | 3 |
| 6 | (0, 2, 0, 2, 0) | 0 | **1** | 4 |
| 7 | (0, 0, 0, 3, 0) | 0 | — | 3 |
| 8 | (0, 0, 4, 0, 0) | **1** | — | 4 |

**Nível 2 — 6 formas × 5 Domínios = 30 cartas** · sem Marca de Chronos

| Forma | Custo relativo | Kléos | ⛵ | Total |
|---|---|---|---|---|
| 1 | (0, 0, 2, 3, 2) | 1 | **1** | 7 |
| 2 | (2, 0, 3, 3, 0) | 1 | — | 8 |
| 3 | (0, 5, 0, 0, 0) | 2 | — | 5 |
| 4 | (0, 1, 4, 2, 0) | 2 | **1** | 7 |
| 5 | (0, 0, 0, 5, 3) | 2 | — | 8 |
| 6 | (6, 0, 0, 0, 0) | **3** | — | 6 |

**Nível 3 — 4 formas × 5 Domínios = 20 cartas** · **todas com Marca de Chronos**

| Forma | Custo relativo | Kléos | ⛵ | Total |
|---|---|---|---|---|
| 1 | (0, 3, 3, 5, 3) | 3 | **1** | 14 |
| 2 | (0, 0, 0, 7, 0) | 4 | — | 7 |
| 3 | (3, 0, 0, 6, 3) | 4 | — | 12 |
| 4 | (3, 0, 0, 7, 0) | **5** | **2** | 10 |

### 14.3 Tipos base

```ts
export const ESSENCIAS = ['eter', 'oceano', 'terra', 'chama', 'sombra'] as const;
export type Essencia = typeof ESSENCIAS[number];

/** Ícor: coringa, só se obtém reservando. Chronos: especial, só em Lendas nível 3. */
export type Ficha = Essencia | 'icor' | 'chronos';
export const FICHAS: readonly Ficha[] = [...ESSENCIAS, 'icor', 'chronos'];

export type Custo = Record<Essencia, number>;   // nunca inclui icor nem chronos
export type Bolsa = Record<Ficha, number>;

export interface Lenda {
  id: string;
  nivel: 1 | 2 | 3;
  dominio: Essencia;
  kleos: number;
  custo: Custo;
  argo: 0 | 1 | 2;      // Símbolos do Argo
  chronos: boolean;     // Marca de Chronos — true sse nivel === 3
  nome: string;
}

export interface FaceSantuario {
  id: string;
  cartao: 1 | 2 | 3 | 4 | 5 | 6;  // cartão físico
  face: 'A' | 'B';                 // só uma das duas entra em jogo
  nome: string;
  patrono: string;
  kleos: 3;
  requisito: Custo;
}
```

### 14.4 As 90 Lendas

```ts
export const LENDAS: Lenda[] = [

  // ─── NÍVEL 1 — Relíquias e Presságios (40) ───
  // ETER
  { id: 'L1-ETE-01', nivel: 1, dominio: 'eter', kleos: 0, custo: { eter: 0, oceano: 1, terra: 1, chama: 1, sombra: 1 }, argo: 0, chronos: false, nome: 'Ambrosia' },
  { id: 'L1-ETE-02', nivel: 1, dominio: 'eter', kleos: 0, custo: { eter: 0, oceano: 1, terra: 2, chama: 1, sombra: 1 }, argo: 1, chronos: false, nome: 'Néctar Divino' },
  { id: 'L1-ETE-03', nivel: 1, dominio: 'eter', kleos: 0, custo: { eter: 0, oceano: 2, terra: 2, chama: 0, sombra: 1 }, argo: 0, chronos: false, nome: 'Coroa de Louros' },
  { id: 'L1-ETE-04', nivel: 1, dominio: 'eter', kleos: 0, custo: { eter: 1, oceano: 0, terra: 0, chama: 1, sombra: 3 }, argo: 0, chronos: false, nome: 'Sandálias Aladas' },
  { id: 'L1-ETE-05', nivel: 1, dominio: 'eter', kleos: 0, custo: { eter: 0, oceano: 0, terra: 0, chama: 2, sombra: 1 }, argo: 0, chronos: false, nome: 'Pena de Ícaro' },
  { id: 'L1-ETE-06', nivel: 1, dominio: 'eter', kleos: 0, custo: { eter: 0, oceano: 2, terra: 0, chama: 2, sombra: 0 }, argo: 1, chronos: false, nome: 'Cálice de Hebe' },
  { id: 'L1-ETE-07', nivel: 1, dominio: 'eter', kleos: 0, custo: { eter: 0, oceano: 0, terra: 0, chama: 3, sombra: 0 }, argo: 0, chronos: false, nome: 'Chama de Héstia' },
  { id: 'L1-ETE-08', nivel: 1, dominio: 'eter', kleos: 1, custo: { eter: 0, oceano: 0, terra: 4, chama: 0, sombra: 0 }, argo: 0, chronos: false, nome: 'Fio de Ariadne' },
  // OCEANO
  { id: 'L1-OCE-01', nivel: 1, dominio: 'oceano', kleos: 0, custo: { eter: 1, oceano: 0, terra: 1, chama: 1, sombra: 1 }, argo: 0, chronos: false, nome: 'Concha de Tritão' },
  { id: 'L1-OCE-02', nivel: 1, dominio: 'oceano', kleos: 0, custo: { eter: 1, oceano: 0, terra: 1, chama: 2, sombra: 1 }, argo: 1, chronos: false, nome: 'Rede do Pescador' },
  { id: 'L1-OCE-03', nivel: 1, dominio: 'oceano', kleos: 0, custo: { eter: 1, oceano: 0, terra: 2, chama: 2, sombra: 0 }, argo: 0, chronos: false, nome: 'Ânfora do Egeu' },
  { id: 'L1-OCE-04', nivel: 1, dominio: 'oceano', kleos: 0, custo: { eter: 3, oceano: 1, terra: 0, chama: 0, sombra: 1 }, argo: 0, chronos: false, nome: 'Espuma Sagrada' },
  { id: 'L1-OCE-05', nivel: 1, dominio: 'oceano', kleos: 0, custo: { eter: 1, oceano: 0, terra: 0, chama: 0, sombra: 2 }, argo: 0, chronos: false, nome: 'Remo do Argo' },
  { id: 'L1-OCE-06', nivel: 1, dominio: 'oceano', kleos: 0, custo: { eter: 0, oceano: 0, terra: 2, chama: 0, sombra: 2 }, argo: 1, chronos: false, nome: 'Pérola de Tétis' },
  { id: 'L1-OCE-07', nivel: 1, dominio: 'oceano', kleos: 0, custo: { eter: 0, oceano: 0, terra: 0, chama: 0, sombra: 3 }, argo: 0, chronos: false, nome: 'Sal do Mar Jônio' },
  { id: 'L1-OCE-08', nivel: 1, dominio: 'oceano', kleos: 1, custo: { eter: 0, oceano: 0, terra: 0, chama: 4, sombra: 0 }, argo: 0, chronos: false, nome: 'Âncora de Bronze' },
  // TERRA
  { id: 'L1-TER-01', nivel: 1, dominio: 'terra', kleos: 0, custo: { eter: 1, oceano: 1, terra: 0, chama: 1, sombra: 1 }, argo: 0, chronos: false, nome: 'Espiga Dourada' },
  { id: 'L1-TER-02', nivel: 1, dominio: 'terra', kleos: 0, custo: { eter: 1, oceano: 1, terra: 0, chama: 1, sombra: 2 }, argo: 1, chronos: false, nome: 'Oliveira Sagrada' },
  { id: 'L1-TER-03', nivel: 1, dominio: 'terra', kleos: 0, custo: { eter: 0, oceano: 1, terra: 0, chama: 2, sombra: 2 }, argo: 0, chronos: false, nome: 'Cornucópia' },
  { id: 'L1-TER-04', nivel: 1, dominio: 'terra', kleos: 0, custo: { eter: 1, oceano: 3, terra: 1, chama: 0, sombra: 0 }, argo: 0, chronos: false, nome: 'Tirso' },
  { id: 'L1-TER-05', nivel: 1, dominio: 'terra', kleos: 0, custo: { eter: 2, oceano: 1, terra: 0, chama: 0, sombra: 0 }, argo: 0, chronos: false, nome: 'Cajado do Pastor' },
  { id: 'L1-TER-06', nivel: 1, dominio: 'terra', kleos: 0, custo: { eter: 2, oceano: 0, terra: 0, chama: 2, sombra: 0 }, argo: 1, chronos: false, nome: 'Vinha do Egeu' },
  { id: 'L1-TER-07', nivel: 1, dominio: 'terra', kleos: 0, custo: { eter: 3, oceano: 0, terra: 0, chama: 0, sombra: 0 }, argo: 0, chronos: false, nome: 'Semente de Perséfone' },
  { id: 'L1-TER-08', nivel: 1, dominio: 'terra', kleos: 1, custo: { eter: 0, oceano: 0, terra: 0, chama: 0, sombra: 4 }, argo: 0, chronos: false, nome: 'Mel do Himeto' },
  // CHAMA
  { id: 'L1-CHA-01', nivel: 1, dominio: 'chama', kleos: 0, custo: { eter: 1, oceano: 1, terra: 1, chama: 0, sombra: 1 }, argo: 0, chronos: false, nome: 'Tocha de Prometeu' },
  { id: 'L1-CHA-02', nivel: 1, dominio: 'chama', kleos: 0, custo: { eter: 2, oceano: 1, terra: 1, chama: 0, sombra: 1 }, argo: 1, chronos: false, nome: 'Martelo de Bronze' },
  { id: 'L1-CHA-03', nivel: 1, dominio: 'chama', kleos: 0, custo: { eter: 2, oceano: 0, terra: 1, chama: 0, sombra: 2 }, argo: 0, chronos: false, nome: 'Fole da Forja' },
  { id: 'L1-CHA-04', nivel: 1, dominio: 'chama', kleos: 0, custo: { eter: 0, oceano: 1, terra: 3, chama: 1, sombra: 0 }, argo: 0, chronos: false, nome: 'Carvão do Etna' },
  { id: 'L1-CHA-05', nivel: 1, dominio: 'chama', kleos: 0, custo: { eter: 0, oceano: 2, terra: 1, chama: 0, sombra: 0 }, argo: 0, chronos: false, nome: 'Lança de Bronze' },
  { id: 'L1-CHA-06', nivel: 1, dominio: 'chama', kleos: 0, custo: { eter: 0, oceano: 2, terra: 0, chama: 0, sombra: 2 }, argo: 1, chronos: false, nome: 'Braseiro Votivo' },
  { id: 'L1-CHA-07', nivel: 1, dominio: 'chama', kleos: 0, custo: { eter: 0, oceano: 3, terra: 0, chama: 0, sombra: 0 }, argo: 0, chronos: false, nome: 'Fagulha de Hefesto' },
  { id: 'L1-CHA-08', nivel: 1, dominio: 'chama', kleos: 1, custo: { eter: 4, oceano: 0, terra: 0, chama: 0, sombra: 0 }, argo: 0, chronos: false, nome: 'Elmo Coríntio' },
  // SOMBRA
  { id: 'L1-SOM-01', nivel: 1, dominio: 'sombra', kleos: 0, custo: { eter: 1, oceano: 1, terra: 1, chama: 1, sombra: 0 }, argo: 0, chronos: false, nome: 'Óbolo de Caronte' },
  { id: 'L1-SOM-02', nivel: 1, dominio: 'sombra', kleos: 0, custo: { eter: 1, oceano: 2, terra: 1, chama: 1, sombra: 0 }, argo: 1, chronos: false, nome: 'Romã de Perséfone' },
  { id: 'L1-SOM-03', nivel: 1, dominio: 'sombra', kleos: 0, custo: { eter: 2, oceano: 2, terra: 0, chama: 1, sombra: 0 }, argo: 0, chronos: false, nome: 'Flor de Asfódelo' },
  { id: 'L1-SOM-04', nivel: 1, dominio: 'sombra', kleos: 0, custo: { eter: 0, oceano: 0, terra: 1, chama: 3, sombra: 1 }, argo: 0, chronos: false, nome: 'Mortalha de Linho' },
  { id: 'L1-SOM-05', nivel: 1, dominio: 'sombra', kleos: 0, custo: { eter: 0, oceano: 0, terra: 2, chama: 1, sombra: 0 }, argo: 0, chronos: false, nome: 'Urna Funerária' },
  { id: 'L1-SOM-06', nivel: 1, dominio: 'sombra', kleos: 0, custo: { eter: 2, oceano: 0, terra: 2, chama: 0, sombra: 0 }, argo: 1, chronos: false, nome: 'Véu de Nix' },
  { id: 'L1-SOM-07', nivel: 1, dominio: 'sombra', kleos: 0, custo: { eter: 0, oceano: 0, terra: 3, chama: 0, sombra: 0 }, argo: 0, chronos: false, nome: 'Cinzas do Estige' },
  { id: 'L1-SOM-08', nivel: 1, dominio: 'sombra', kleos: 1, custo: { eter: 0, oceano: 4, terra: 0, chama: 0, sombra: 0 }, argo: 0, chronos: false, nome: 'Chave do Tártaro' },

  // ─── NÍVEL 2 — Heróis e Criaturas (30) ───
  // ETER
  { id: 'L2-ETE-01', nivel: 2, dominio: 'eter', kleos: 1, custo: { eter: 0, oceano: 0, terra: 2, chama: 3, sombra: 2 }, argo: 1, chronos: false, nome: 'Íris' },
  { id: 'L2-ETE-02', nivel: 2, dominio: 'eter', kleos: 1, custo: { eter: 2, oceano: 0, terra: 3, chama: 3, sombra: 0 }, argo: 0, chronos: false, nome: 'Ganimedes' },
  { id: 'L2-ETE-03', nivel: 2, dominio: 'eter', kleos: 2, custo: { eter: 0, oceano: 5, terra: 0, chama: 0, sombra: 0 }, argo: 0, chronos: false, nome: 'Éolo' },
  { id: 'L2-ETE-04', nivel: 2, dominio: 'eter', kleos: 2, custo: { eter: 0, oceano: 1, terra: 4, chama: 2, sombra: 0 }, argo: 1, chronos: false, nome: 'Pégaso' },
  { id: 'L2-ETE-05', nivel: 2, dominio: 'eter', kleos: 2, custo: { eter: 0, oceano: 0, terra: 0, chama: 5, sombra: 3 }, argo: 0, chronos: false, nome: 'Orfeu' },
  { id: 'L2-ETE-06', nivel: 2, dominio: 'eter', kleos: 3, custo: { eter: 6, oceano: 0, terra: 0, chama: 0, sombra: 0 }, argo: 0, chronos: false, nome: 'Eos' },
  // OCEANO
  { id: 'L2-OCE-01', nivel: 2, dominio: 'oceano', kleos: 1, custo: { eter: 2, oceano: 0, terra: 0, chama: 2, sombra: 3 }, argo: 1, chronos: false, nome: 'Nereida' },
  { id: 'L2-OCE-02', nivel: 2, dominio: 'oceano', kleos: 1, custo: { eter: 0, oceano: 2, terra: 0, chama: 3, sombra: 3 }, argo: 0, chronos: false, nome: 'Tritão' },
  { id: 'L2-OCE-03', nivel: 2, dominio: 'oceano', kleos: 2, custo: { eter: 0, oceano: 0, terra: 5, chama: 0, sombra: 0 }, argo: 0, chronos: false, nome: 'Sirene' },
  { id: 'L2-OCE-04', nivel: 2, dominio: 'oceano', kleos: 2, custo: { eter: 0, oceano: 0, terra: 1, chama: 4, sombra: 2 }, argo: 1, chronos: false, nome: 'Cila' },
  { id: 'L2-OCE-05', nivel: 2, dominio: 'oceano', kleos: 2, custo: { eter: 3, oceano: 0, terra: 0, chama: 0, sombra: 5 }, argo: 0, chronos: false, nome: 'Caríbdis' },
  { id: 'L2-OCE-06', nivel: 2, dominio: 'oceano', kleos: 3, custo: { eter: 0, oceano: 6, terra: 0, chama: 0, sombra: 0 }, argo: 0, chronos: false, nome: 'Jasão' },
  // TERRA
  { id: 'L2-TER-01', nivel: 2, dominio: 'terra', kleos: 1, custo: { eter: 3, oceano: 2, terra: 0, chama: 0, sombra: 2 }, argo: 1, chronos: false, nome: 'Dríade' },
  { id: 'L2-TER-02', nivel: 2, dominio: 'terra', kleos: 1, custo: { eter: 3, oceano: 0, terra: 2, chama: 0, sombra: 3 }, argo: 0, chronos: false, nome: 'Sátiro' },
  { id: 'L2-TER-03', nivel: 2, dominio: 'terra', kleos: 2, custo: { eter: 0, oceano: 0, terra: 0, chama: 5, sombra: 0 }, argo: 0, chronos: false, nome: 'Centauro' },
  { id: 'L2-TER-04', nivel: 2, dominio: 'terra', kleos: 2, custo: { eter: 2, oceano: 0, terra: 0, chama: 1, sombra: 4 }, argo: 1, chronos: false, nome: 'Quíron' },
  { id: 'L2-TER-05', nivel: 2, dominio: 'terra', kleos: 2, custo: { eter: 5, oceano: 3, terra: 0, chama: 0, sombra: 0 }, argo: 0, chronos: false, nome: 'Atalanta' },
  { id: 'L2-TER-06', nivel: 2, dominio: 'terra', kleos: 3, custo: { eter: 0, oceano: 0, terra: 6, chama: 0, sombra: 0 }, argo: 0, chronos: false, nome: 'Javali de Erimanto' },
  // CHAMA
  { id: 'L2-CHA-01', nivel: 2, dominio: 'chama', kleos: 1, custo: { eter: 2, oceano: 3, terra: 2, chama: 0, sombra: 0 }, argo: 1, chronos: false, nome: 'Ciclope' },
  { id: 'L2-CHA-02', nivel: 2, dominio: 'chama', kleos: 1, custo: { eter: 3, oceano: 3, terra: 0, chama: 2, sombra: 0 }, argo: 0, chronos: false, nome: 'Quimera' },
  { id: 'L2-CHA-03', nivel: 2, dominio: 'chama', kleos: 2, custo: { eter: 0, oceano: 0, terra: 0, chama: 0, sombra: 5 }, argo: 0, chronos: false, nome: 'Fênix' },
  { id: 'L2-CHA-04', nivel: 2, dominio: 'chama', kleos: 2, custo: { eter: 4, oceano: 2, terra: 0, chama: 0, sombra: 1 }, argo: 1, chronos: false, nome: 'Talos' },
  { id: 'L2-CHA-05', nivel: 2, dominio: 'chama', kleos: 2, custo: { eter: 0, oceano: 5, terra: 3, chama: 0, sombra: 0 }, argo: 0, chronos: false, nome: 'Belerofonte' },
  { id: 'L2-CHA-06', nivel: 2, dominio: 'chama', kleos: 3, custo: { eter: 0, oceano: 0, terra: 0, chama: 6, sombra: 0 }, argo: 0, chronos: false, nome: 'Aquiles' },
  // SOMBRA
  { id: 'L2-SOM-01', nivel: 2, dominio: 'sombra', kleos: 1, custo: { eter: 0, oceano: 2, terra: 3, chama: 2, sombra: 0 }, argo: 1, chronos: false, nome: 'Harpia' },
  { id: 'L2-SOM-02', nivel: 2, dominio: 'sombra', kleos: 1, custo: { eter: 0, oceano: 3, terra: 3, chama: 0, sombra: 2 }, argo: 0, chronos: false, nome: 'Erínia' },
  { id: 'L2-SOM-03', nivel: 2, dominio: 'sombra', kleos: 2, custo: { eter: 5, oceano: 0, terra: 0, chama: 0, sombra: 0 }, argo: 0, chronos: false, nome: 'Medusa' },
  { id: 'L2-SOM-04', nivel: 2, dominio: 'sombra', kleos: 2, custo: { eter: 1, oceano: 4, terra: 2, chama: 0, sombra: 0 }, argo: 1, chronos: false, nome: 'Hidra de Lerna' },
  { id: 'L2-SOM-05', nivel: 2, dominio: 'sombra', kleos: 2, custo: { eter: 0, oceano: 0, terra: 5, chama: 3, sombra: 0 }, argo: 0, chronos: false, nome: 'Caronte' },
  { id: 'L2-SOM-06', nivel: 2, dominio: 'sombra', kleos: 3, custo: { eter: 0, oceano: 0, terra: 0, chama: 0, sombra: 6 }, argo: 0, chronos: false, nome: 'Cérbero' },

  // ─── NÍVEL 3 — Titãs e Primordiais (20) · todas com a Marca de Chronos ───
  // ETER
  { id: 'L3-ETE-01', nivel: 3, dominio: 'eter', kleos: 3, custo: { eter: 0, oceano: 3, terra: 3, chama: 5, sombra: 3 }, argo: 1, chronos: true, nome: 'Hélios' },
  { id: 'L3-ETE-02', nivel: 3, dominio: 'eter', kleos: 4, custo: { eter: 0, oceano: 0, terra: 0, chama: 7, sombra: 0 }, argo: 0, chronos: true, nome: 'Selene' },
  { id: 'L3-ETE-03', nivel: 3, dominio: 'eter', kleos: 4, custo: { eter: 3, oceano: 0, terra: 0, chama: 6, sombra: 3 }, argo: 0, chronos: true, nome: 'Hipérion' },
  { id: 'L3-ETE-04', nivel: 3, dominio: 'eter', kleos: 5, custo: { eter: 3, oceano: 0, terra: 0, chama: 7, sombra: 0 }, argo: 2, chronos: true, nome: 'Urano' },
  // OCEANO
  { id: 'L3-OCE-01', nivel: 3, dominio: 'oceano', kleos: 3, custo: { eter: 3, oceano: 0, terra: 3, chama: 3, sombra: 5 }, argo: 1, chronos: true, nome: 'Nereu' },
  { id: 'L3-OCE-02', nivel: 3, dominio: 'oceano', kleos: 4, custo: { eter: 0, oceano: 0, terra: 0, chama: 0, sombra: 7 }, argo: 0, chronos: true, nome: 'Ponto' },
  { id: 'L3-OCE-03', nivel: 3, dominio: 'oceano', kleos: 4, custo: { eter: 3, oceano: 3, terra: 0, chama: 0, sombra: 6 }, argo: 0, chronos: true, nome: 'Tétis' },
  { id: 'L3-OCE-04', nivel: 3, dominio: 'oceano', kleos: 5, custo: { eter: 0, oceano: 3, terra: 0, chama: 0, sombra: 7 }, argo: 2, chronos: true, nome: 'Oceano' },
  // TERRA
  { id: 'L3-TER-01', nivel: 3, dominio: 'terra', kleos: 3, custo: { eter: 5, oceano: 3, terra: 0, chama: 3, sombra: 3 }, argo: 1, chronos: true, nome: 'Anteu' },
  { id: 'L3-TER-02', nivel: 3, dominio: 'terra', kleos: 4, custo: { eter: 7, oceano: 0, terra: 0, chama: 0, sombra: 0 }, argo: 0, chronos: true, nome: 'Ládon' },
  { id: 'L3-TER-03', nivel: 3, dominio: 'terra', kleos: 4, custo: { eter: 6, oceano: 3, terra: 3, chama: 0, sombra: 0 }, argo: 0, chronos: true, nome: 'Reia' },
  { id: 'L3-TER-04', nivel: 3, dominio: 'terra', kleos: 5, custo: { eter: 7, oceano: 0, terra: 3, chama: 0, sombra: 0 }, argo: 2, chronos: true, nome: 'Gaia' },
  // CHAMA
  { id: 'L3-CHA-01', nivel: 3, dominio: 'chama', kleos: 3, custo: { eter: 3, oceano: 5, terra: 3, chama: 0, sombra: 3 }, argo: 1, chronos: true, nome: 'Briareu' },
  { id: 'L3-CHA-02', nivel: 3, dominio: 'chama', kleos: 4, custo: { eter: 0, oceano: 7, terra: 0, chama: 0, sombra: 0 }, argo: 0, chronos: true, nome: 'Tifão' },
  { id: 'L3-CHA-03', nivel: 3, dominio: 'chama', kleos: 4, custo: { eter: 0, oceano: 6, terra: 3, chama: 3, sombra: 0 }, argo: 0, chronos: true, nome: 'Prometeu' },
  { id: 'L3-CHA-04', nivel: 3, dominio: 'chama', kleos: 5, custo: { eter: 0, oceano: 7, terra: 0, chama: 3, sombra: 0 }, argo: 2, chronos: true, nome: 'Héracles' },
  // SOMBRA
  { id: 'L3-SOM-01', nivel: 3, dominio: 'sombra', kleos: 3, custo: { eter: 3, oceano: 3, terra: 5, chama: 3, sombra: 0 }, argo: 1, chronos: true, nome: 'Tânatos' },
  { id: 'L3-SOM-02', nivel: 3, dominio: 'sombra', kleos: 4, custo: { eter: 0, oceano: 0, terra: 7, chama: 0, sombra: 0 }, argo: 0, chronos: true, nome: 'Érebo' },
  { id: 'L3-SOM-03', nivel: 3, dominio: 'sombra', kleos: 4, custo: { eter: 0, oceano: 0, terra: 6, chama: 3, sombra: 3 }, argo: 0, chronos: true, nome: 'Nix' },
  { id: 'L3-SOM-04', nivel: 3, dominio: 'sombra', kleos: 5, custo: { eter: 0, oceano: 0, terra: 7, chama: 0, sombra: 3 }, argo: 2, chronos: true, nome: 'Cronos' },];
```

### 14.5 As 12 faces de Santuário

Seis cartões físicos, duas faces cada. No setup, sorteia-se `nº de jogadores` cartões e, para cada um, uma das faces.

```ts
export const SANTUARIOS: FaceSantuario[] = [
  { id: 'SAN-01A', cartao: 1, face: 'A', nome: 'Partenon', patrono: 'Atena', kleos: 3, requisito: { eter: 4, oceano: 0, terra: 4, chama: 0, sombra: 0 } },
  { id: 'SAN-01B', cartao: 1, face: 'B', nome: 'Samos', patrono: 'Hera', kleos: 3, requisito: { eter: 3, oceano: 3, terra: 3, chama: 0, sombra: 0 } },
  { id: 'SAN-02A', cartao: 2, face: 'A', nome: 'Corinto', patrono: 'Afrodite', kleos: 3, requisito: { eter: 0, oceano: 4, terra: 0, chama: 4, sombra: 0 } },
  { id: 'SAN-02B', cartao: 2, face: 'B', nome: 'Naxos', patrono: 'Dionísio', kleos: 3, requisito: { eter: 0, oceano: 3, terra: 3, chama: 3, sombra: 0 } },
  { id: 'SAN-03A', cartao: 3, face: 'A', nome: 'Elêusis', patrono: 'Deméter', kleos: 3, requisito: { eter: 0, oceano: 0, terra: 4, chama: 0, sombra: 4 } },
  { id: 'SAN-03B', cartao: 3, face: 'B', nome: 'Tártaro', patrono: 'Hades', kleos: 3, requisito: { eter: 0, oceano: 0, terra: 3, chama: 3, sombra: 3 } },
  { id: 'SAN-04A', cartao: 4, face: 'A', nome: 'Lemnos', patrono: 'Hefesto', kleos: 3, requisito: { eter: 4, oceano: 0, terra: 0, chama: 4, sombra: 0 } },
  { id: 'SAN-04B', cartao: 4, face: 'B', nome: 'Esparta', patrono: 'Ares', kleos: 3, requisito: { eter: 3, oceano: 0, terra: 0, chama: 3, sombra: 3 } },
  { id: 'SAN-05A', cartao: 5, face: 'A', nome: 'Cnossos', patrono: 'Poseidon', kleos: 3, requisito: { eter: 0, oceano: 4, terra: 0, chama: 0, sombra: 4 } },
  { id: 'SAN-05B', cartao: 5, face: 'B', nome: 'Éfeso', patrono: 'Ártemis', kleos: 3, requisito: { eter: 3, oceano: 3, terra: 0, chama: 0, sombra: 3 } },
  { id: 'SAN-06A', cartao: 6, face: 'A', nome: 'Olimpo', patrono: 'Zeus', kleos: 3, requisito: { eter: 2, oceano: 2, terra: 2, chama: 2, sombra: 2 } },
  { id: 'SAN-06B', cartao: 6, face: 'B', nome: 'Delfos', patrono: 'Apolo', kleos: 3, requisito: { eter: 2, oceano: 2, terra: 2, chama: 2, sombra: 2 } },];
```

### 14.6 Configuração por número de jogadores

```ts
export const CONFIG_PARTIDA = {
  2: { fichasPorEssencia: 4, chronos: 2, santuarios: 2 },
  3: { fichasPorEssencia: 5, chronos: 3, santuarios: 3 },
  4: { fichasPorEssencia: 7, chronos: 4, santuarios: 4 },
} as const;

export const ICOR_TOTAL       = 5;   // sempre 5, independente do nº de jogadores
export const KLEOS_KERAUNOS   = 16;  // ⚠️ 16, não 15
export const LIMITE_FICHAS    = 10;  // inclui ícor E chronos
export const MAX_PRESSAGIOS   = 3;
export const MIN_PARA_DUPLA   = 4;   // pilha precisa de ≥4 para colher 2 iguais
export const CARTAS_VISIVEIS  = 4;   // por fileira
export const ARGO_LIMIAR      = 3;   // símbolos mínimos para tomar Os Argonautas
export const KLEOS_SANTUARIO  = 3;
export const KLEOS_ARGONAUTAS = 3;
export const MAX_CHRONOS_POR_JOGADOR = 1;

/** Fichas que NÃO podem ser obtidas pelas Ações A e B. */
export const FICHAS_FORA_DO_MERCADO: readonly Ficha[] = ['icor', 'chronos'];

/** Fichas que NÃO podem ser devolvidas no descarte do limite de 10. */
export const FICHAS_NAO_DEVOLVIVEIS: readonly Ficha[] = ['chronos'];
```

---

## 15. Especificação técnica — modelo de estado

### 15.1 Princípio: motor puro e determinístico

O motor é uma **função pura**:

```ts
reduzir(estado: EstadoJogo, acao: Acao): Resultado<EstadoJogo>
```

Sem `Math.random()`, sem `Date.now()`, sem I/O dentro do reducer. Toda aleatoriedade entra pelo **seed** da partida. Isso permite rodar o mesmo motor no cliente (previsão otimista) e no servidor (autoridade), fazer replay a partir do seed + lista de ações, e testar de forma determinística.

> **Regra de ouro:** o servidor é a autoridade. O cliente pode prever o resultado para dar resposta instantânea, mas sempre reconcilia com o estado que o servidor devolve.

### 15.2 Tipos de estado

```ts
export type FaseJogo =
  | 'AGUARDANDO_JOGADORES'
  | 'EM_ANDAMENTO'
  | 'ULTIMA_RODADA'
  | 'ENCERRADO';

export type SubFaseTurno =
  | 'ESCOLHENDO_ACAO'        // estado normal
  | 'DESCARTANDO'            // passou de 10 fichas
  | 'ESCOLHENDO_SANTUARIO';  // qualificou para 2+ santuários

export interface Jogador {
  id: string;
  nome: string;
  avatar: string;
  ordem: number;              // 0..3, posição fixa na mesa
  fichas: Bolsa;              // essências + ícor + chronos
  lendas: string[];           // ids das Lendas reivindicadas
  dominios: Custo;            // derivado de `lendas`, em cache
  pressagios: Pressagio[];    // máx. 3
  santuarios: string[];       // ids das faces recebidas
  simbolosArgo: number;       // derivado: Σ argo das lendas, em cache
  temChronos: boolean;        // derivado: fichas.chronos > 0
  kleos: number;              // derivado (INCLUI Os Argonautas), em cache
  conectado: boolean;
  turnosAusente: number;
}

export interface Pressagio {
  cartaId: string;
  oculto: boolean;    // true = reservado do topo do baralho
  nivel: 1 | 2 | 3;   // sempre público, mesmo se oculto
}

export interface EstadoJogo {
  partidaId: string;
  seed: string;
  fase: FaseJogo;
  subFase: SubFaseTurno;

  jogadores: Jogador[];
  jogadorAtual: number;
  numeroDoTurno: number;

  reservatorio: Bolsa;        // inclui icor e chronos

  baralhos: { 1: string[]; 2: string[]; 3: string[] };  // topo = índice 0
  fileiras: {
    1: (string | null)[];   // length 4 sempre; null = espaço vazio permanente
    2: (string | null)[];
    3: (string | null)[];
  };

  santuariosDisponiveis: string[];      // ids de FACE, já sorteadas no setup
  argonautas: { dono: string | null };  // itinerante

  disparouUltimaRodada: string | null;
  vencedores: string[];

  descartePendente: { jogadorId: string; excedente: number } | null;
  escolhaSantuarioPendente: { jogadorId: string; opcoes: string[] } | null;

  historico: EventoJogo[];
  atualizadoEm: number;
  prazoDoTurno: number | null;
}
```

### 15.3 Tipos de ação

```ts
export type Acao =
  | { tipo: 'COLHER_DIFERENTES';   jogadorId: string; essencias: Essencia[] }
  | { tipo: 'COLHER_IGUAIS';       jogadorId: string; essencia: Essencia }
  | { tipo: 'REIVINDICAR';         jogadorId: string; cartaId: string;
                                   origem: 'fileira' | 'pressagio' }
  | { tipo: 'RESERVAR';            jogadorId: string;
                                   alvo: { tipo: 'fileira'; cartaId: string }
                                       | { tipo: 'baralho'; nivel: 1 | 2 | 3 } }
  | { tipo: 'DEVOLVER_FICHAS';     jogadorId: string; fichas: Partial<Bolsa> }
  | { tipo: 'ESCOLHER_SANTUARIO';  jogadorId: string; santuarioId: string }
  | { tipo: 'PASSAR';              jogadorId: string };
```

> Note que **`essencias: Essencia[]`**, não `Ficha[]`. O sistema de tipos já impede pedir Ícor ou Chronos nas Ações A e B. Use essa garantia — não confie só na validação em runtime.

### 15.4 Máquina de estados do turno

```
                        ┌───────────────────────┐
                        │   ESCOLHENDO_ACAO     │
                        └───────────┬───────────┘
                                    │ ação principal válida
                                    ▼
                        ┌───────────────────────────────────┐
                        │  resolver ação                    │
                        │  · mover fichas / cartas          │
                        │  · se REIVINDICAR nível 3 e       │
                        │    !temChronos → +1 ficha Chronos │
                        └───────────┬───────────────────────┘
                                    ▼
                     total de fichas do jogador > 10 ?
                          │ sim                │ não
                          ▼                    │
                 ┌────────────────┐            │
                 │  DESCARTANDO   │            │   (Chronos NUNCA devolvível)
                 └───────┬────────┘            │
                         │ DEVOLVER_FICHAS     │
                         └──────────┬──────────┘
                                    ▼
                     ┌──────────────────────────────┐
                     │ 1. OS ARGONAUTAS             │
                     │    simbolos >= 3 e           │
                     │    simbolos > dono atual ?   │
                     │    → transferir carta        │
                     └──────────────┬───────────────┘
                                    ▼
                     quantos Santuários o jogador qualifica?
                    │ 0            │ 1                 │ 2+
                    │              ▼                   ▼
                    │      conceder Santuário  ┌────────────────────────┐
                    │              │           │ ESCOLHENDO_SANTUARIO   │
                    │              │           └───────────┬────────────┘
                    └──────────────┴───────────────────────┘
                                    ▼
                     ┌──────────────────────────────────────┐
                     │ 2. KERAUNOS                          │
                     │    kleos >= 16                       │
                     │    E 1 domínio de CADA essência      │
                     │    E temChronos                      │
                     │    → fase = ULTIMA_RODADA            │
                     └──────────────┬───────────────────────┘
                                    ▼
                     é o último jogador da ordem?
                    │ não                        │ sim
                    ▼                            ▼
        próximo jogador             fase == ULTIMA_RODADA ?
        subFase = ESCOLHENDO_ACAO   │ sim              │ não
        numeroDoTurno++             ▼                  ▼
                                REAVALIAR         próximo jogador
                                todos contra
                                o Keraunos
                            │ alguém        │ ninguém
                            ▼               ▼
                        ENCERRADO      limpar flag,
                        + vencedores   JOGO CONTINUA
```

> ⚠️ Os dois pontos que mais dão errado nesta máquina:
> 1. **A ordem** — Argonautas antes de Santuário, ambos antes do Keraunos. Os três alteram `kleos`, e o gatilho depende do total final.
> 2. **A reavaliação no fim da rodada final** — o gatilho pode se desfazer (Seção 12.4). Nunca trate `ULTIMA_RODADA` como "já acabou".

### 15.5 Invariantes

Após todo `reduzir()`, tudo abaixo deve valer:

1. `Σ fichas de todos os jogadores + reservatório == fichas iniciais`, por tipo (conservação).
2. `jogador.dominios[e] == nº de lendas do jogador com dominio === e`, para todo `e`.
3. `jogador.simbolosArgo == Σ argo das lendas do jogador`.
4. `jogador.kleos == Σ kleos(lendas) + 3 × santuarios.length + (dono d'Os Argonautas ? 3 : 0)`.
5. `jogador.temChronos === (jogador.fichas.chronos > 0)` e `fichas.chronos <= 1`.
6. `jogador.fichas.chronos > 0` ⇒ o jogador tem ao menos 1 Lenda de nível 3.
7. `jogador.pressagios.length <= 3`.
8. `Σ fichas(jogador) <= 10` sempre que `subFase !== 'DESCARTANDO'`.
9. `fileiras[n].length === 4` sempre; posições vazias são `null`.
10. Nenhum `cartaId` aparece em mais de um lugar (baralho, fileira, presságio, lendas).
11. `argonautas.dono !== null` ⇒ esse jogador tem `simbolosArgo >= 3`, **e** é quem tem mais símbolos (ou empatado no topo).
12. `santuariosDisponiveis` + santuários recebidos por todos = conjunto sorteado no setup.
13. Nenhuma face de Santuário em jogo compartilha `cartao` com outra (um cartão só entra por uma face).
14. Nenhuma carta com `chronos: true` tem `nivel !== 3`, e vice-versa.

Escreva `verificarInvariantes(estado)` e rode-a em **todo** teste e, em desenvolvimento, após toda ação.

---

## 16. Validação e resolução de ações

### 16.1 Funções de validação

Cada ação tem `podeX(estado, acao): { ok: true } | { ok: false; motivo: string }`. A UI usa as mesmas funções para **desabilitar botões antes do clique** — nunca deixe o jogador tentar uma ação ilegal e receber um erro depois.

```ts
// ─── Colher 3 diferentes ───
function podeColherDiferentes(e: EstadoJogo, jId: string, essencias: Essencia[]): Resultado {
  if (!ehVezDe(e, jId)) return erro('Não é seu turno');
  if (e.subFase !== 'ESCOLHENDO_ACAO') return erro('Resolva a etapa pendente');
  if (new Set(essencias).size !== essencias.length) return erro('Essências repetidas');
  if (essencias.some(x => !ESSENCIAS.includes(x)))
    return erro('Ícor e Chronos não podem ser colhidos');

  const disponiveis = ESSENCIAS.filter(x => e.reservatorio[x] > 0);
  const maximo = Math.min(3, disponiveis.length);

  if (essencias.length !== maximo) return erro(`Você deve pegar exatamente ${maximo}`);
  if (essencias.some(x => e.reservatorio[x] <= 0)) return erro('Essência esgotada');
  return ok();
}

// ─── Colher 2 iguais ───
function podeColherIguais(e: EstadoJogo, jId: string, essencia: Essencia): Resultado {
  if (!ehVezDe(e, jId)) return erro('Não é seu turno');
  if (e.subFase !== 'ESCOLHENDO_ACAO') return erro('Resolva a etapa pendente');
  if (!ESSENCIAS.includes(essencia)) return erro('Ícor e Chronos não podem ser colhidos');
  if (e.reservatorio[essencia] < MIN_PARA_DUPLA)      // ← 4, não 2
    return erro('A pilha precisa ter ao menos 4 essências');
  return ok();
}

// ─── Reservar ───
function podeReservar(e: EstadoJogo, j: Jogador, alvo): Resultado {
  if (!ehVezDe(e, j.id)) return erro('Não é seu turno');
  if (e.subFase !== 'ESCOLHENDO_ACAO') return erro('Resolva a etapa pendente');
  if (j.pressagios.length >= MAX_PRESSAGIOS) return erro('Você já tem 3 presságios');
  if (alvo.tipo === 'baralho' && e.baralhos[alvo.nivel].length === 0)
    return erro('Baralho vazio');
  if (alvo.tipo === 'fileira' && !cartaEstaVisivel(e, alvo.cartaId))
    return erro('Carta indisponível');
  return ok();   // NÃO checar ícor: reservar sem ícor é legal
}

// ─── Reivindicar ───
function calcularPagamento(j: Jogador, carta: Lenda):
  { possivel: boolean; pagamento: Bolsa } {

  const pagamento = zerarBolsa();
  let icorNecessario = 0;

  for (const ess of ESSENCIAS) {
    const faltante = Math.max(0, carta.custo[ess] - j.dominios[ess]);
    const comFicha = Math.min(j.fichas[ess], faltante);
    pagamento[ess] = comFicha;
    icorNecessario += faltante - comFicha;
  }

  pagamento.icor = icorNecessario;
  pagamento.chronos = 0;                      // Chronos NUNCA paga nada
  return { possivel: icorNecessario <= j.fichas.icor, pagamento };
}

function podeReivindicar(e: EstadoJogo, j: Jogador, cartaId: string): Resultado {
  if (!ehVezDe(e, j.id)) return erro('Não é seu turno');
  if (e.subFase !== 'ESCOLHENDO_ACAO') return erro('Resolva a etapa pendente');

  const disponivel = cartaEstaVisivel(e, cartaId)
    || j.pressagios.some(p => p.cartaId === cartaId);
  if (!disponivel) return erro('Carta indisponível');

  const { possivel } = calcularPagamento(j, LENDA_POR_ID[cartaId]);
  return possivel ? ok() : erro('Essências insuficientes');
}

// ─── Devolver fichas ───
function podeDevolver(e: EstadoJogo, j: Jogador, fichas: Partial<Bolsa>): Resultado {
  if (e.subFase !== 'DESCARTANDO') return erro('Nada a devolver');
  if ((fichas.chronos ?? 0) > 0)
    return erro('A Essência de Chronos não pode ser devolvida');
  const total = soma(fichas);
  if (total !== e.descartePendente!.excedente)
    return erro(`Devolva exatamente ${e.descartePendente!.excedente}`);
  for (const f of FICHAS)
    if ((fichas[f] ?? 0) > j.fichas[f]) return erro('Você não tem essas fichas');
  return ok();
}
```

### 16.2 Ganho da Essência de Chronos

Resolvido **dentro** da Ação C, não no fim do turno:

```ts
function aplicarChronos(e: EstadoJogo, jId: string, carta: Lenda): EstadoJogo {
  if (!carta.chronos) return e;                       // só nível 3
  const j = jogador(e, jId);
  if (j.temChronos) return e;                         // máx. 1 por jogador, para sempre
  if (e.reservatorio.chronos <= 0) return e;          // acabou (não ocorre no jogo base)

  return atualizar(e, {
    reservatorio: { ...e.reservatorio, chronos: e.reservatorio.chronos - 1 },
    jogador: { ...j, fichas: { ...j.fichas, chronos: 1 }, temChronos: true },
  });
}
```

### 16.3 Pipeline de fim de turno

Chame **sempre** esta sequência após resolver a ação principal. A ordem não é negociável.

```ts
function finalizarTurno(e: EstadoJogo, apartirDe: Etapa = 'descarte'): EstadoJogo {
  const j = jogadorAtual(e);

  // 1. limite de 10 fichas
  if (apartirDe === 'descarte') {
    const total = somaFichas(j.fichas);
    if (total > LIMITE_FICHAS) {
      return { ...e, subFase: 'DESCARTANDO',
               descartePendente: { jogadorId: j.id, excedente: total - LIMITE_FICHAS } };
    }
  }

  // 2. Os Argonautas (pode mudar o kleos de DOIS jogadores)
  if (apartirDe !== 'santuario') {
    e = verificarArgonautas(e, j.id);
  }

  // 3. Santuário (máx. 1 por turno)
  if (apartirDe !== 'santuario') {
    const elegiveis = e.santuariosDisponiveis.filter(id =>
      ESSENCIAS.every(x => j.dominios[x] >= SANTUARIO_POR_ID[id].requisito[x]));

    if (elegiveis.length > 1) {
      return { ...e, subFase: 'ESCOLHENDO_SANTUARIO',
               escolhaSantuarioPendente: { jogadorId: j.id, opcoes: elegiveis } };
    }
    if (elegiveis.length === 1) e = concederSantuario(e, j.id, elegiveis[0]);
  }

  // 4. gatilho do Keraunos
  if (e.fase === 'EM_ANDAMENTO' && cumpreKeraunos(e, jogadorAtual(e))) {
    e = { ...e, fase: 'ULTIMA_RODADA', disparouUltimaRodada: j.id };
  }

  // 5. avançar / encerrar
  const ehUltimoDaOrdem = e.jogadorAtual === e.jogadores.length - 1;

  if (ehUltimoDaOrdem && e.fase === 'ULTIMA_RODADA') {
    const qualificados = e.jogadores.filter(p => cumpreKeraunos(e, p));
    if (qualificados.length > 0) return encerrarPartida(e, qualificados);

    // Regra especial: o gatilho se desfez. O jogo continua.
    e = { ...e, fase: 'EM_ANDAMENTO', disparouUltimaRodada: null };
    e = registrar(e, { t: 'GATILHO_DESFEITO' });
  }

  return {
    ...e,
    jogadorAtual: (e.jogadorAtual + 1) % e.jogadores.length,
    numeroDoTurno: e.numeroDoTurno + 1,
    subFase: 'ESCOLHENDO_ACAO',
    descartePendente: null,
    escolhaSantuarioPendente: null,
    prazoDoTurno: agora() + DURACAO_TURNO_MS,
  };
}
```

> ⚠️ `DESCARTANDO` e `ESCOLHENDO_SANTUARIO` **retornam cedo** sem avançar o turno. Quando a sub-ação chegar, o reducer chama `finalizarTurno` de novo com `apartirDe` apropriado, retomando do ponto seguinte. Não torne as etapas re-executáveis por acidente: conceder dois Santuários no mesmo turno é o bug mais provável aqui.

### 16.4 Encerramento

```ts
function encerrarPartida(e: EstadoJogo, qualificados: Jogador[]): EstadoJogo {
  const ranking = [...qualificados].sort((a, b) =>
    b.kleos - a.kleos                                            // 1º: mais Kléos
    || ordemArgonautas(e, a, b)                                  // 2º: quem tem Os Argonautas
    || a.lendas.length - b.lendas.length                         // 3º: menos Lendas
  );

  const topo = ranking[0];
  const vencedores = ranking.filter(p =>
    p.kleos === topo.kleos
    && (e.argonautas.dono === p.id) === (e.argonautas.dono === topo.id)
    && p.lendas.length === topo.lendas.length
  ).map(p => p.id);   // pode haver mais de um

  return { ...e, fase: 'ENCERRADO', vencedores, prazoDoTurno: null };
}

function ordemArgonautas(e: EstadoJogo, a: Jogador, b: Jogador): number {
  const ta = e.argonautas.dono === a.id ? 1 : 0;
  const tb = e.argonautas.dono === b.id ? 1 : 0;
  return tb - ta;   // quem tem a carta vem primeiro
}
```

### 16.5 Embaralhamento determinístico

```ts
// PRNG reprodutível (mulberry32) — mesmo seed, mesma partida.
function prng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function embaralhar<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Sorteio dos Santuários: escolhe N cartões e, para cada um, uma face. */
function sortearSantuarios(nJogadores: 2 | 3 | 4, rnd: () => number): string[] {
  const cartoes = embaralhar([1, 2, 3, 4, 5, 6], rnd)
    .slice(0, CONFIG_PARTIDA[nJogadores].santuarios);
  return cartoes.map(c => {
    const faces = SANTUARIOS.filter(s => s.cartao === c);
    return faces[Math.floor(rnd() * faces.length)].id;
  });
}
```

O `seed` é gerado pelo servidor e **nunca é enviado ao cliente durante a partida** — com ele o cliente preveria todo o baralho. Envie apenas no `ENCERRADO`, para permitir replay.

---

## 17. Protocolo online real-time

### 17.1 Arquitetura

```
  Navegador (React)                      Servidor (autoridade)
  ┌───────────────────┐                 ┌──────────────────────┐
  │  UI + store       │  ─ ação ──────► │  valida com o MESMO  │
  │  motor local      │                 │  motor puro          │
  │  (previsão)       │  ◄─ estado ───  │  persiste + difunde  │
  └───────────────────┘                 └──────────────────────┘
           ▲                                       │
           └──────── broadcast p/ a sala ──────────┘
```

**Regras não negociáveis:**

- O cliente **nunca** decide o resultado. Pode aplicar a ação localmente para feedback instantâneo, mas o estado que vale é o do servidor.
- O servidor valida **tudo**: vez do jogador, legalidade da ação, correspondência entre `partidaId`/`jogadorId` e a sessão autenticada.
- O servidor **nunca confia** em campo derivado enviado pelo cliente (kléos, domínios, símbolos do Argo, pagamento). Recalcula sempre.
- Toda ação carrega um `nonce`; o servidor descarta duplicatas (double-click, reenvio).

### 17.2 Ciclo de vida da sala

```
CRIADA → SAGUÃO → EM_ANDAMENTO → ENCERRADA → (descartada da memória)
```

> Sem persistência externa (Seção 17.7): a sala vive só no `Map` do processo.
> Ela é descartada quando o servidor reinicia/dorme, ou pelos dois timers de
> limpeza de 17.6 — não há arquivamento nem histórico para consultar depois.

| Estado | Descrição |
|---|---|
| **SAGUÃO** | Anfitrião cria a sala e recebe um código de 6 caracteres (ex.: `OLY-4K2`). Jogadores entram pelo código ou link. 2–4 jogadores. O anfitrião inicia. |
| **EM_ANDAMENTO** | Partida rodando. Ninguém novo entra. Espectadores opcionais (fase 2). |
| **ENCERRADA** | Tela de resultado com placar detalhado e botão "Revanche" (nova sala, mesmos jogadores). |

### 17.3 Eventos WebSocket

**Cliente → Servidor**

| Evento | Payload | Descrição |
|---|---|---|
| `sala:criar` | `{ nome, avatar, config }` | Retorna `{ salaId, codigo }` |
| `sala:entrar` | `{ codigo, nome, avatar }` | Entra no saguão |
| `sala:sair` | `{}` | Sai do saguão |
| `sala:iniciar` | `{}` | Só o anfitrião. Exige ≥2 jogadores |
| `jogo:acao` | `{ nonce, acao: Acao }` | Ação principal ou sub-ação |
| `jogo:sincronizar` | `{ ultimaVersao }` | Pede o estado completo (reconexão) |
| `chat:enviar` | `{ texto }` | Opcional (fase 2) |
| `ping` | `{ t }` | Keep-alive a cada 20s |

**Servidor → Cliente**

| Evento | Payload | Descrição |
|---|---|---|
| `sala:atualizada` | `{ jogadores, anfitriao, codigo }` | Mudança no saguão |
| `jogo:iniciado` | `{ estadoVisivel }` | Setup completo |
| `jogo:estado` | `{ versao, estadoVisivel }` | Snapshot autoritativo |
| `jogo:evento` | `{ versao, evento: EventoJogo }` | Delta para animação e feed |
| `jogo:acao_rejeitada` | `{ nonce, motivo }` | Reverte a previsão do cliente |
| `jogo:seu_turno` | `{ prazo }` | Dispara notificação/vibração |
| `jogo:encerrado` | `{ ranking, seed }` | Resultado + seed para replay |
| `jogador:conexao` | `{ jogadorId, conectado }` | Atualiza indicador de presença |

### 17.4 Versionamento e reconciliação

- Todo estado difundido carrega `versao: number`, incrementado a cada ação aceita.
- O cliente guarda a última `versao` recebida.
- `jogo:evento` com `versao !== local + 1` ⇒ o cliente **descarta e pede `jogo:sincronizar`**. Nunca remende buracos.
- Previsão otimista: o cliente aplica a ação e marca `pendente: nonce`. Confirmado pelo servidor, descarta a previsão; em `acao_rejeitada`, reverte para o último estado do servidor e mostra o motivo.

> ⚠️ **A previsão otimista d'Os Argonautas é enganosa.** A carta pode sair de você no turno de um adversário, o que muda o seu `kleos` sem nenhuma ação sua. Nunca derive `kleos` de estado local previsto para decidir qualquer coisa — use sempre o valor confirmado pelo servidor.

### 17.5 Eventos de jogo (animação e feed)

```ts
export type EventoJogo =
  | { t: 'COLHEU';           jogadorId: string; fichas: Partial<Bolsa> }
  | { t: 'REIVINDICOU';      jogadorId: string; cartaId: string; pagamento: Bolsa;
                             origem: 'fileira' | 'pressagio'; reposta: string | null }
  | { t: 'GANHOU_CHRONOS';   jogadorId: string; cartaId: string }
  | { t: 'RESERVOU';         jogadorId: string; cartaId: string | null; nivel: 1|2|3;
                             oculto: boolean; ganhouIcor: boolean; reposta: string | null }
  | { t: 'DEVOLVEU';         jogadorId: string; fichas: Partial<Bolsa> }
  | { t: 'ARGONAUTAS';       de: string | null; para: string; simbolos: number }
  | { t: 'SANTUARIO';        jogadorId: string; santuarioId: string }
  | { t: 'PASSOU';           jogadorId: string; motivo: string }
  | { t: 'ULTIMA_RODADA';    jogadorId: string }
  | { t: 'GATILHO_DESFEITO'; }
  | { t: 'FIM';              vencedores: string[] };
```

O feed lateral traduz isso em linguagem temática: *"Helena reivindicou **Medusa** (Sombra, 2 Kléos)"*, *"**Tártaro** se une a Rafael"*, *"Brendon tomou **Os Argonautas** de Helena — 5 símbolos contra 4"*, *"Helena forjou a Essência de **Chronos**"*.

### 17.6 Desconexão, timers e abandono

| Situação | Comportamento |
|---|---|
| Jogador perde conexão fora do seu turno | Avatar acinzentado. O jogo segue até chegar a vez dele. |
| Jogador perde conexão no seu turno | O timer continua correndo. |
| Timer do turno expira (padrão **90s**, configurável; 0 = sem limite) | O servidor executa **ação automática**: colhe 3 essências diferentes (ou o máximo disponível); se nem isso for possível, `PASSAR`. **Nunca reivindica nem reserva automaticamente** — reivindicar mudaria a estratégia do jogador de forma irreversível. |
| `DESCARTANDO` expira | O servidor devolve as fichas mais abundantes, priorizando **não** devolver Ícor. **Chronos nunca é candidata.** |
| `ESCOLHENDO_SANTUARIO` expira | O servidor concede o **primeiro** da lista de opções. |
| 3 turnos seguidos por timeout | Jogador marcado como `ausente`. Segue recebendo ações automáticas. A sala oferece votação para encerrar. |
| Jogador reconecta | `jogo:sincronizar` devolve o estado completo. Não replique animações perdidas — mostre o estado atual e o feed. |
| Anfitrião sai do saguão | Anfitrião transferido ao próximo. Sala vazia é destruída. |
| Último jogador da sala desconecta | A sala **não** é destruída na hora. O servidor arma um timer de **5 minutos**; se ninguém reconectar até lá, a sala é descartada do `Map`. Qualquer jogador reconectando antes disso cancela o timer. |

**Persistência: nenhuma.** Sem Redis, sem Postgres — o estado vive só no `Map`
em memória do processo (Seção 17.7). Uma queda ou hibernação do servidor
**perde as partidas em andamento**; isso é aceitável para este projeto de
testes e não deve ser "corrigido" adicionando um banco de dados.

---

### 17.7 Deploy no Render (plano gratuito)

O alvo de deploy é o **Render**, plano gratuito, com dois serviços: um
*static site* para `packages/web` e um *web service* para `packages/servidor`.

**A condição que rege este design:** o serviço gratuito do Render **dorme
após 15 minutos sem tráfego** e leva **~1 minuto para acordar** na próxima
requisição. Mensagens de WebSocket de conexões já abertas **contam como
tráfego** — então, uma vez que a partida está rodando com jogadores
conectados, o serviço fica acordado. Só a *primeira* conexão do dia (ou após
um período ocioso) paga o custo de ~1 minuto.

**Decisões de arquitetura decorrentes:**

1. **Sem persistência externa.** Redis e Postgres estão fora — ver a nota de
   Persistência em 17.6 e a linha de Persistência em 21.1. Salas vivem num
   `Map` em memória, por instância; perder salas quando o serviço dorme ou
   reinicia é esperado.
2. **Dois serviços no `render.yaml`:** *static site* (`packages/web`) com
   rewrite de SPA (`/*` → `/index.html`, necessário porque é uma aplicação de
   página única) e *web service* (`packages/servidor`), ambos no plano
   gratuito.
3. **O servidor** escuta em `process.env.PORT` com bind em `0.0.0.0` (é assim
   que o Render roteia tráfego até o processo), expõe `GET /health`
   respondendo `200` imediatamente (sem depender de banco, sala ou qualquer
   outro estado), e libera CORS **só** para a origem configurada em
   `ORIGEM_PERMITIDA`.
4. **O cliente nunca conecta o socket direto.** Antes de qualquer tentativa
   de WebSocket, passa por uma tela de despertar: faz *polling* em
   `GET /health` a cada 2s até obter uma resposta, mostrando os segundos
   decorridos e um texto explicando que a primeira conexão do dia pode levar
   ~1 minuto. Só depois de `/health` responder o socket conecta.
5. **O cliente configura o Socket.IO com `reconnectionAttempts: Infinity` e
   `reconnectionDelayMax` de 5s.** É o que permite ao jogo sobreviver a
   quedas de rede do jogador — e, incidentalmente, também a uma hibernação do
   servidor no meio de uma sessão ociosa: o socket insiste em reconectar em
   vez de abandonar a partida.
6. **Limpeza de salas vazias:** quando o último jogador de uma sala
   desconecta, o servidor arma um timer de 5 minutos antes de descartá-la do
   `Map` (ver a linha correspondente em 17.6). Sem isso, salas abandonadas
   vazariam memória indefinidamente ao longo de uma instância que fica
   acordada por sessões longas.

---

## 18. Informação pública vs. privada

É a parte mais fácil de errar e a mais fácil de explorar por trapaça. **O servidor mantém `EstadoJogo` completo e envia a cada cliente uma projeção diferente.** Nunca envie o estado bruto.

### Público para todos

- Reservatório central: contagem exata de cada essência, do Ícor **e de Chronos**.
- As 12 Lendas visíveis.
- **Quantidade** de cartas restantes em cada baralho.
- Santuários disponíveis (face visível).
- Dono atual d'Os Argonautas.
- De cada jogador: fichas por tipo (**incluindo se tem Chronos**), Lendas reivindicadas, Domínios, símbolos do Argo, Kléos, Santuários recebidos, **número** de Presságios e o **nível** de cada um.
- Presságio reservado **de uma fileira visível**: identidade pública.
- Progresso de cada jogador rumo ao Keraunos (é tudo derivado de informação pública).

### Privado

- A **identidade** dos Presságios reservados do **topo do baralho** — só para o dono.
- A **ordem dos baralhos** (`baralhos[n]` como array de ids).
- O `seed`, até o encerramento.

### Projeção

```ts
function projetarPara(e: EstadoJogo, espectadorId: string): EstadoVisivel {
  return {
    ...e,
    seed: e.fase === 'ENCERRADO' ? e.seed : undefined,
    baralhos: {
      1: e.baralhos[1].length,     // só a contagem
      2: e.baralhos[2].length,
      3: e.baralhos[3].length,
    },
    jogadores: e.jogadores.map(j => ({
      ...j,
      pressagios: j.pressagios.map(p =>
        (p.oculto && j.id !== espectadorId)
          ? { cartaId: null, oculto: true, nivel: p.nivel }   // ← esconde o id
          : p
      ),
    })),
  };
}
```

> ⚠️ Não envie `cartaId` e "esconda no CSS". Qualquer jogador abre o DevTools. A identidade tem que **não sair do servidor**.

---

## 19. UI/UX responsiva

### 19.1 Regra que governa todo o layout

O turno dura de 5 a 20 segundos. Cada toque a mais é uma fração enorme do turno. **Meta: qualquer ação completa em no máximo 2 toques.**

| Ação | Toques |
|---|---|
| Colher 3 diferentes | 3 toques nas fichas + confirmação automática ao completar |
| Colher 2 iguais | 1 toque longo (ou duplo-toque) na pilha |
| Reivindicar Lenda | 1 toque na carta (abre foco) + 1 em "Reivindicar" |
| Reservar Presságio | 1 toque na carta + 1 em "Reservar" |

### 19.2 Breakpoints

| Nome | Largura | Layout |
|---|---|---|
| `mobile` | < 640px | Vertical, uma coluna, painéis em gaveta |
| `tablet` | 640–1023px | Duas colunas, tabuleiro central + coluna lateral |
| `desktop` | ≥ 1024px | Três zonas: oponentes / tabuleiro / você |

### 19.3 Layout desktop (≥1024px)

```
┌───────────────────────────────────────────────────────────────────────┐
│ OLYMPOS  sala OLY-4K2  ⏱0:47   ⚡16 ✓  🜲◐3/5  ⧗✗   ← KERAUNOS  [🔊][⚙]│
├──────────┬────────────────────────────────────────────┬───────────────┤
│SANTUÁRIOS│            FILEIRAS DE LENDAS              │  OPONENTES    │
│ ┌──────┐ │  ╔═╗ ┌────┐┌────┐┌────┐┌────┐              │ ┌───────────┐ │
│ │Olimpo│ │  ║3║ │Nix ││Gaia││Ura ││Cro │  ← Titãs ⧗   │ │Helena  9★ │ │
│ │ Zeus │ │  ╚═╝ └────┘└────┘└────┘└────┘              │ │⛵4 ⧗✓     │ │
│ │2 cada│ │  ╔═╗ ┌────┐┌────┐┌────┐┌────┐              │ │▪3▪2▪1▪0▪2 │ │
│ │◐ 7/10│ │  ║2║ │Talo││Cila││Med ││Quir│  ← Heróis    │ └───────────┘ │
│ └──────┘ │  ╚═╝ └────┘└────┘└────┘└────┘              │ ┌───────────┐ │
│ ┌──────┐ │  ╔═╗ ┌────┐┌────┐┌────┐┌────┐              │ │Rafael  6★ │ │
│ │Esparta│ │ ║1║ │Amb ││Rede││Tirs││Toch│  ← Relíquias │ │⛵2 ⧗✗     │ │
│ │ Ares │ │  ╚═╝ └────┘└────┘└────┘└────┘              │ │▪2▪4▪0▪1▪0 │ │
│ │3Ch3So│ │                                             │ └───────────┘ │
│ │ 3Ét  │ │   RESERVATÓRIO                              │               │
│ └──────┘ │   ⚡7  🌊5  🌿7  🔥4  🌑6  │ 💧3  ⧗2       │  ⛵ ARGONAUTAS │
│          │                            └ fora do mercado│  Helena (4)   │
├──────────┴────────────────────────────────────────────┴───────────────┤
│ VOCÊ · Brendon · 16 Kléos                    [ Presságios: 🂠 🂠 ]      │
│ Fichas   ⚡2 🌊0 🌿3 🔥1 🌑0 │ 💧1 ⧗1   (8/10)                        │
│ Domínios ⚡3 🌊1 🌿4 🔥2 🌑0        ⛵ 3 símbolos                      │
└───────────────────────────────────────────────────────────────────────┘
```

- A **barra do Keraunos fica no topo, sempre visível**, com os três requisitos.
- Zona inferior (você) fixa e sempre visível.
- Reservatório perto da sua zona. Ícor e Chronos ficam **visualmente separados** por um divisor — são "fora do mercado" e nunca clicáveis para colheita.
- Dono d'Os Argonautas exibido em bloco próprio, com a contagem de símbolos.

### 19.4 Layout mobile (<640px) — o mais importante

```
┌─────────────────────────┐
│⏱0:47 OLY-4K2         ☰ │
│⚡16✓ 🜲3/5 ⧗✗   KERAUNOS│ ← barra fixa, 2 linhas
├─────────────────────────┤
│👤Helena 9★ ⛵4⧗✓ ▪▪▪ 🔴│ ← 1 linha por oponente;
│👤Rafael 6★ ⛵2⧗✗ ▪▪▪ 🟢│   toque abre bottom-sheet
├─────────────────────────┤
│⛵ Argonautas: Helena (4)│
├─────────────────────────┤
│ ⛩ SANTUÁRIOS      2 ▸  │ ← acordeão; mostra "1/2 perto"
├─────────────────────────┤
│   ╔═╗ ┌───┐┌───┐        │
│   ║3║ │  ⧗││  ⧗│  ⟷    │ ← 3 fileiras, scroll HORIZONTAL
│   ╚═╝ └───┘└───┘        │   com snap por carta
│   ╔═╗ ┌───┐┌───┐        │
│   ║2║ │   ││   │  ⟷    │
│   ╚═╝ └───┘└───┘        │
│   ╔═╗ ┌───┐┌───┐        │
│   ║1║ │   ││   │  ⟷    │
│   ╚═╝ └───┘└───┘        │
├─────────────────────────┤
│⚡7 🌊5 🌿7 🔥4 🌑6│💧3 ⧗2│ ← reservatório; divisor antes
├─────────────────────────┤   de ícor/chronos
│VOCÊ 16★  8/10  ⛵3  🂠🂠 │ ← painel fixo, arrastável
│⚡2 🌊0 🌿3 🔥1 🌑0│💧1 ⧗1│
└─────────────────────────┘
```

**Decisões críticas para mobile:**

1. **Fileiras com scroll horizontal e snap.** Não encolha as 4 cartas para caber na largura — ficariam ilegíveis. Cada carta ocupa ~40% da largura, com snap.
2. **Reservatório sempre visível**, logo acima do painel do jogador. Alvos de toque ≥48×48px. Ícor e Chronos separados por divisor, renderizados como **não clicáveis**.
3. **Painel do jogador é bottom-sheet arrastável**: recolhido mostra Kléos, fichas, símbolos e presságios; expandido mostra Domínios, Lendas por Domínio e progresso dos Santuários.
4. **Oponentes em faixas de uma linha**, com símbolos do Argo e estado de Chronos sempre à vista — são informação de corrida.
5. **Nada de hover.** Toda informação que no desktop aparece em hover precisa de estado de toque explícito.
6. **Foco de carta**: tocar abre um modal com a carta ampliada, o custo **decomposto** (`3 🌿 − 2 domínio = 1 a pagar`), a Marca de Chronos destacada se for nível 3 e o jogador ainda não a tiver, e dois botões grandes: **Reivindicar** / **Reservar**. Botões desabilitados exibem o motivo.

### 19.5 O painel do Keraunos

É o elemento de UI mais importante do jogo e o que mais difere de um Splendor comum. **Nunca pode sair da tela.**

```
┌──────────────────────────────────────────────────┐
│  ⚡ KERAUNOS                                     │
│  ✓ 16 Kléos            16/16                     │
│  ◐ 1 Domínio de cada   ⚡✓ 🌊✓ 🌿✓ 🔥✓ 🌑✗      │
│  ✗ Essência de Chronos  — falta 1 Lenda nível 3  │
└──────────────────────────────────────────────────┘
```

**Requisitos:**

- Os três itens **sempre visíveis**, cada um com estado inequívoco: `✓` cumprido, `◐` parcial, `✗` não cumprido.
- O requisito de Domínios mostra **quais essências faltam**, por ícone — não "3/5".
- O requisito de Chronos, quando faltando, diz **como obtê-lo**: "reivindique qualquer Lenda de nível 3".
- Quando os três estiverem `✓`, o painel inteiro acende e a UI anuncia claramente: **"Você pode forjar o Keraunos ao final deste turno."**
- **Nunca mostre "faltam X pontos para vencer" isoladamente.** Pontos são só um dos três requisitos, e é exatamente o erro que a UI precisa evitar induzir.
- Mostre também, de forma compacta, o progresso dos **oponentes** nos três requisitos. É informação pública e é o que gera tensão.

### 19.6 A carta — informação obrigatória

Uma Lenda precisa comunicar seis coisas de relance, mesmo em 120px:

```
┌──────────────────┐
│ 3★    ⛵⛵    🌿 │  ← Kléos · Símbolos do Argo · Domínio
│              ⧗   │  ← Marca de Chronos (só nível 3)
│   [arte/ícone]   │
│      Gaia        │  ← nome (some abaixo de 100px)
│ ─────────────────│
│ 🌊3 🌿3 🔥5 🌑3  │  ← custo, ordem canônica, só cores > 0
└──────────────────┘
```

**Estados visuais obrigatórios:**

| Estado | Tratamento |
|---|---|
| Reivindicável agora | Borda dourada pulsante suave |
| Reivindicável **só com Ícor** | Borda dourada + ícone de gota de Ícor |
| Não reivindicável | Normal, sem destaque. **Não escureça** — é preciso ler o custo para planejar |
| Custo já coberto por Domínio | Número riscado com o restante ao lado: `3̶ →1` |
| Nível 3 e o jogador **não** tem Chronos | Marca de Chronos ⧗ **destacada e pulsante** — é o gargalo da vitória |
| Nível 3 e o jogador **já** tem Chronos | Marca ⧗ apagada, sem destaque |
| Carta que te daria Os Argonautas | Badge ⛵ destacado + texto "toma Os Argonautas" |
| Selecionada | Elevação + contorno |
| Recém-reposta | Animação de entrada de 300ms a partir do baralho |

> O contraste entre "posso comprar" e "não posso" se faz por **adição de destaque**, nunca por remoção de legibilidade.

### 19.7 Fluxos de toque

**Colher 3 diferentes**
1. Toque na ficha ⚡ → salta para a "bandeja de seleção" acima do reservatório.
2. Toque em 🌿, toque em 🔥.
3. Ao completar 3 (ou o máximo disponível), a ação é **confirmada automaticamente** após 400ms, com "desfazer" durante o intervalo.
4. Tocar numa ficha selecionada a devolve.
5. **Ícor e Chronos não respondem ao toque.** Um toque neles mostra "não pode ser colhida" e nada mais.

**Colher 2 iguais**
- Toque longo (300ms) ou duplo-toque na pilha. Pilhas com menos de 4 mostram cadeado ao serem pressionadas, com tooltip "precisa de 4".
- Alternativa acessível: tocar a mesma pilha duas vezes na bandeja.

**Devolver fichas (>10)**
- Tela escurece parcialmente, painel do jogador expande.
- Título: **"Devolva 2 fichas"**, contador ao vivo `12 → 10`.
- Toque nas próprias fichas para devolver. **A ficha de Chronos aparece com cadeado** e o texto "a Essência de Chronos não pode ser devolvida".
- "Confirmar" só habilita no número exato.
- O timer do turno **pausa** nessa etapa (ou reinicia com 30s).

**Escolher Santuário**
- Modal com os elegíveis lado a lado: nome, patrono, requisito. Um toque escolhe.

### 19.8 Feedback e animação

| Evento | Feedback |
|---|---|
| Início do seu turno | Vibração curta (mobile), brilho na borda, som suave |
| Ficha colhida | Voa do reservatório ao painel (200ms) |
| Lenda reivindicada | Carta voa para a sua área; fichas pagas voltam ao reservatório |
| **Essência de Chronos obtida** | Animação destacada: ampulheta cravando no painel, 1s, com "A Essência de Chronos é sua" |
| **Os Argonautas mudam de dono** | A carta **voa de um jogador para o outro**, 800ms, com o placar de símbolos: "5 ⛵ contra 4 ⛵". Precisa ser inconfundível — o dono anterior perdeu 3 Kléos |
| Santuário conquistado | Retrato do patrono em tela cheia por 1,2s: *"Tártaro se une a você"* |
| Alguém cumpre o Keraunos | Faixa fixa no topo: **"Última rodada — Helena forjou o Keraunos"** |
| **Gatilho desfeito** | Faixa distinta, tom de alívio/tensão: **"O Keraunos se desfez. O jogo continua."** Este evento é raro e confuso; explique-o em uma frase na própria faixa |
| Timer < 15s | Barra do timer fica vermelha e pulsa |

**Duração máxima: 400ms**, exceto Chronos (1s), Santuário (1,2s) e Argonautas (800ms) — todos puláveis com toque. Ofereça `Configurações → Animações reduzidas` e respeite `prefers-reduced-motion`.

### 19.9 Sempre visível, em qualquer tela

Em qualquer breakpoint, isto **nunca** pode exigir um toque para ser visto:

1. Seus Kléos.
2. **Seu progresso nos três requisitos do Keraunos.**
3. Suas fichas por tipo + total `n/10`, com Chronos identificável.
4. Contagem do reservatório central.
5. De quem é a vez, e o timer.
6. Kléos, símbolos do Argo e estado de Chronos de cada oponente.
7. **Quem está com Os Argonautas.**
8. As 12 Lendas visíveis (mesmo que via scroll).

---

## 20. Acessibilidade

- **Nunca use cor como único canal.** Cada ficha tem cor **+ ícone** (⚡ éter, 🌊 oceano, 🌿 terra, 🔥 chama, 🌑 sombra, 💧 ícor, ⧗ chronos) **+** posição fixa na ordem canônica. Um jogador daltônico deve conseguir jogar só pelos ícones e pela posição.
- Modo **"padrões de alto contraste"**: além do ícone, uma textura/hachura distinta por essência.
- Alvos de toque ≥ 44×44px (48px no reservatório).
- Contraste de texto mínimo AA (4.5:1); números de custo em AAA quando possível.
- Navegação completa por teclado no desktop: `Tab` entre zonas, setas dentro da zona, `Enter` para agir, `Esc` para cancelar.
- `aria-live="polite"` no feed; `aria-live="assertive"` em "é a sua vez", na mudança d'Os Argonautas, na última rodada e no gatilho desfeito.
- `aria-label` completo em cada carta: *"Medusa, nível 2, domínio Sombra, 2 Kléos, 1 símbolo do Argo, custo 5 Oceano e 3 Terra. Você pode reivindicar."*
- O painel do Keraunos precisa ser legível por leitor de tela como uma lista de três itens com estado, não como um amontoado de ícones.
- Toda mensagem de erro é textual e específica, nunca só um shake ou um som.

---

## 21. Stack sugerida e roteiro de implementação

### 21.1 Stack

| Camada | Escolha | Motivo |
|---|---|---|
| Front | **React + TypeScript + Vite** | Tipos fortes no motor são o que evita bugs de regra |
| Estilo | **Tailwind CSS** | Breakpoints e estados rápidos de iterar |
| Estado | **Zustand** | Store simples; combina bem com um reducer puro |
| Animação | **Framer Motion** | `layoutId` resolve "a carta voa de um jogador para o outro" quase de graça |
| Transporte | **Socket.IO** | Reconexão automática e salas prontas |
| Servidor | **Node + TypeScript**, mesmo pacote do motor | O motor precisa ser **literalmente o mesmo código** nos dois lados |
| Persistência | **Nenhuma.** Salas vivem num `Map` em memória, por instância | Alvo de deploy é o plano gratuito do Render (Seção 17.7): sem orçamento para Redis/Postgres, e não é necessário — é um projeto de testes, jogado em sessões esporádicas. Sala perdida quando o serviço dorme ou reinicia é **aceitável e esperado** |
| Deploy | **Render, plano gratuito** — static site (front) + web service (servidor) | Ver Seção 17.7 para as implicações de sleep/wake no design |

```
/packages
  /motor          ← puro, sem React, sem rede. Fonte da verdade.
    dados/        ← LENDAS, SANTUARIOS, CONFIG
    tipos.ts
    reduzir.ts
    validar.ts
    projetar.ts
    invariantes.ts
    motor.test.ts
  /servidor       ← importa @olympos/motor
  /web            ← importa @olympos/motor
```

### 21.2 Roteiro por fases

**Fase 1 — Motor (sem UI).** Tipos, dataset, `reduzir`, validações, `verificarInvariantes`, Chronos, Argonautas, Santuários, gatilho do Keraunos e reavaliação de fim de rodada. Testes cobrindo os 30 casos da Seção 13. **Não escreva uma linha de React antes disso passar.**

**Fase 2 — UI local hotseat.** Um dispositivo, todos os jogadores na mesma tela. Layout desktop primeiro, com o painel do Keraunos desde o começo.

**Fase 3 — Responsividade mobile.** Layout da Seção 19.4, scroll horizontal com snap, bottom-sheets, alvos de toque. Teste em 360×640 real.

**Fase 4 — Rede (alvo: Render, plano gratuito).** Salas em memória (`Map` na
instância do servidor, sem Redis/Postgres — ver Seção 17.7), WebSocket,
projeção por jogador, previsão otimista, reconciliação, reconexão. O servidor
escuta em `process.env.PORT` com bind em `0.0.0.0` e expõe `GET /health`
desde o primeiro commit desta fase — é o que a tela de despertar do cliente
(Fase 5) depende para saber que o serviço acordou.

**Fase 5 — Timers e robustez para o free tier.** Timer de turno, ações
automáticas, desconexão, revanche, e a tela de despertar (Seção 17.7): o
cliente faz polling em `/health` a cada 2s — mostrando os segundos decorridos
e avisando que a primeira conexão do dia pode levar ~1 minuto — e só conecta
o socket depois que `/health` responder. O socket do cliente usa
`reconnectionAttempts: Infinity` e `reconnectionDelayMax` de 5s para
sobreviver a quedas de rede dos jogadores sem abandonar a partida. **Sem
persistência**: não há o que recuperar de um reinício além do que ainda está
no `Map` do servidor.

**Fase 6 — Polimento.** Animações, som, tela cheia de Santuário, voo d'Os Argonautas, feed narrativo, acessibilidade completa.

**Fase 7 (opcional) — Bots.** Heurística gulosa: melhor razão kléos/custo restante, com peso extra para (a) a primeira Lenda de nível 3, (b) Domínios que faltam para completar "1 de cada", (c) cartas com símbolo do Argo quando o bot estiver a 1 símbolo de tomar a carta.

### 21.3 O que NÃO fazer

- ❌ Não coloque lógica de regra em componentes React. Se um `useEffect` decide quem ganhou um Santuário, o projeto já está quebrado.
- ❌ Não trate o jogo como Splendor clássico. São 16 pontos **mais** duas condições, e o gatilho pode se desfazer.
- ❌ Não some os 3 Kléos d'Os Argonautas no `kleos` de forma persistente. Recalcule a partir de `argonautas.dono`.
- ❌ Não permita Chronos no descarte, no pagamento, nas Ações A/B, nem mais de 1 por jogador.
- ❌ Não confie no cliente para nada.
- ❌ Não introduza Redis, Postgres ou qualquer persistência externa. Salas vivem em memória (Seção 17.7); perdê-las quando o serviço dorme é o comportamento esperado, não um bug a corrigir.
- ❌ Não conecte o socket do cliente antes de `/health` responder. No plano gratuito do Render, a primeira tentativa contra um serviço dormindo só gera reconexões frustradas — sempre passe pela tela de despertar primeiro (Seção 17.7).
- ❌ Não use índices de array como identidade de carta. Use `cartaId`.
- ❌ Não implemente "escolher pagar com Ícor". A regra é determinística (Seção 7.3).
- ❌ Não esconda informação pública atrás de toques desnecessários.

---

## 22. Suíte de testes obrigatória

Cada item precisa de ao menos um teste automatizado no pacote `motor`.

**Setup**
- [ ] 2/3/4 jogadores geram 4/5/7 fichas por essência, 2/3/4 Chronos e sempre 5 Ícor.
- [ ] 2/3/4 jogadores revelam **2/3/4** Santuários (não N+1).
- [ ] Nenhum cartão de Santuário entra em jogo com as duas faces.
- [ ] Sempre 12 Lendas visíveis; baralhos com 36/26/16 cartas após o setup.
- [ ] Mesmo seed ⇒ mesma partida, sempre (baralhos e Santuários).

**Colheita**
- [ ] Pegar 3 diferentes reduz o reservatório e aumenta a mão em exatamente 3.
- [ ] Pegar 2 iguais com pilha = 4 é legal; com pilha = 3 é **ilegal**.
- [ ] Com só 2 tipos disponíveis, a Ação A pega 2.
- [ ] **Não é possível colher Ícor nem Chronos** por A ou B.

**Reivindicação**
- [ ] Domínios descontam corretamente; custo coberto ⇒ compra grátis.
- [ ] Ícor cobre exatamente o faltante, nunca mais.
- [ ] **Chronos nunca aparece no pagamento**, mesmo com o jogador a possuindo.
- [ ] Fichas pagas voltam ao reservatório na mesma ação.
- [ ] Reposição imediata; baralho vazio ⇒ `null` permanente.
- [ ] Reivindicar Presságio não repõe nada.

**Reserva**
- [ ] Reservar dá 1 Ícor; sem Ícor no reservatório, ocorre sem ganho.
- [ ] Reservar com 3 Presságios é ilegal.
- [ ] Reserva do topo do baralho não é reposta e é **oculta** na projeção alheia.
- [ ] `projetarPara` nunca vaza `cartaId` de presságio oculto de outro jogador.
- [ ] Não existe ação de descartar Presságio.

**Essência de Chronos**
- [ ] Reivindicar a 1ª Lenda de nível 3 concede exatamente 1 Chronos.
- [ ] Reivindicar a 2ª, 3ª e 4ª Lenda de nível 3 **não** concede nada.
- [ ] Reivindicar um Presságio de nível 3 concede Chronos igualmente.
- [ ] Nenhuma carta de nível 1 ou 2 concede Chronos.
- [ ] Chronos conta para o limite de 10.
- [ ] Devolver Chronos é **rejeitado**, inclusive quando é a única ficha devolvível.

**Limite de fichas**
- [ ] 10 fichas + colher 3 ⇒ `DESCARTANDO` com excedente 3.
- [ ] Devolver número diferente do excedente é rejeitado.
- [ ] Devolver fichas que o jogador não tem é rejeitado.
- [ ] O turno não avança enquanto `DESCARTANDO`.

**Os Argonautas**
- [ ] Ninguém recebe a carta com menos de 3 símbolos.
- [ ] O primeiro a chegar a 3 símbolos recebe automaticamente.
- [ ] Empate em símbolos **mantém o dono atual**.
- [ ] Superar o dono transfere a carta e os 3 Kléos no mesmo instante.
- [ ] O `kleos` do dono anterior cai 3 e o do novo sobe 3.
- [ ] A carta pode trocar de mãos mais de uma vez na mesma partida.
- [ ] Símbolos de Presságios **não** contam.

**Santuários**
- [ ] Qualificação usa Domínios, nunca fichas.
- [ ] Um por turno; com 2 elegíveis entra em `ESCOLHENDO_SANTUARIO`.
- [ ] O não escolhido continua disponível no turno seguinte.
- [ ] Concedido ⇒ sai de `santuariosDisponiveis` e vale exatamente 3 Kléos.

**Keraunos e fim de jogo**
- [ ] 16 Kléos sem "1 de cada Domínio" **não** dispara.
- [ ] 16 Kléos e 1 de cada, mas sem Chronos, **não** dispara.
- [ ] Os três requisitos juntos disparam.
- [ ] Disparo pelo **último** jogador da ordem encerra imediatamente, sem rodada extra.
- [ ] Disparo pelo primeiro em mesa de 4 ⇒ os outros 3 jogam e o jogo acaba.
- [ ] **Gatilho desfeito:** o disparador perde Os Argonautas na rodada final, cai abaixo de 16 e ninguém mais qualifica ⇒ `fase` volta a `EM_ANDAMENTO` e a partida continua.
- [ ] Mesmo cenário, mas outro jogador qualifica ⇒ o jogo acaba e vence esse outro.
- [ ] Jogador com mais Kléos que o vencedor, sem cumprir os requisitos, **não** entra no ranking.
- [ ] Desempate: Kléos → Os Argonautas → menos Lendas → vitória compartilhada.

**Invariantes**
- [ ] `verificarInvariantes` passa após **cada** ação em partida aleatória de 800 turnos (fuzz com 50 seeds).
- [ ] Conservação de fichas nunca é violada, Chronos incluída.
- [ ] Nenhum `cartaId` aparece em dois lugares.
- [ ] `kleos` em cache sempre bate com o recálculo, inclusive após transferências d'Os Argonautas.

---

## Apêndice A — Prompt inicial para o Claude Code

> Leia `docs/OLYMPOS-regras-e-spec.md` por inteiro antes de escrever qualquer código, com atenção especial ao Apêndice C (divergências em relação ao Splendor clássico) e às Seções 5, 9, 11 e 12 — são as regras que um Splendor comum não tem.
>
> Implemente APENAS o pacote `packages/motor` conforme as Seções 14, 15 e 16: tipos, dataset a partir de `docs/olympos-deck.json` (gerado por script, não digitado à mão), `reduzir`, funções `podeX`, `projetarPara`, `verificarInvariantes` e `encerrarPartida`. Motor 100% puro, sem React e sem rede, com toda a aleatoriedade derivada do seed.
>
> Depois escreva a suíte de testes da Seção 22, incluindo o fuzz de 800 turnos e, obrigatoriamente, os testes de "gatilho desfeito" e de transferência d'Os Argonautas.
>
> Não comece a UI antes de todos os testes passarem. Me mostre o resultado dos testes.

## Apêndice B — Extensões futuras (fora do escopo v1)

- **Modo Duelo (2 jogadores)** com tabuleiro de privilégios e coroas.
- **Faces alternativas de Santuário** já existem no dataset (12 faces, 6 em jogo por partida): dá para expor a escolha da face como opção de sala.
- **Espectadores** em salas em andamento.
- **Ranking / ELO** e matchmaking casual.
- **Modo assíncrono** (turnos por notificação).

## Apêndice C — Divergências em relação ao Splendor clássico

Esta é a seção mais importante para quem já conhece o Splendor base. **O ruleset de OLYMPOS é o de *Splendor: Marvel*, não o do Splendor original.** Implementar de memória a partir do clássico produz um jogo errado em pelo menos oito pontos.

| # | Splendor clássico | OLYMPOS (ruleset Marvel) |
|---|---|---|
| 1 | Vitória: **15** pontos de prestígio, e só isso | Vitória: **16 Kléos + 1 Domínio de cada uma das 5 essências + a Essência de Chronos**, os três juntos |
| 2 | Só existe o coringa ouro | Existem **duas** fichas fora do mercado: **Ícor** (coringa, 5) e **Chronos** (especial, 2–4) |
| 3 | — | **Essência de Chronos**: obtida ao reivindicar a 1ª Lenda de nível 3, máx. 1 por jogador, **nunca devolvível**, nunca gasta, sem Domínio |
| 4 | 10 nobres, revela-se **nº de jogadores + 1** | **6 cartões de Santuário de dupla face** (12 faces), revela-se **nº de jogadores** |
| 5 | — | **Os Argonautas**: carta de 3 Kléos **itinerante**, tomada por quem tiver mais Símbolos do Argo (mínimo 3; empate mantém o dono) |
| 6 | Fim de jogo: atingiu 15, completa a rodada, acabou | Fim de jogo: **reavaliação ao fim da rodada final**. Se o disparador perder Os Argonautas e cair abaixo de 16, e ninguém mais qualificar, **o jogo continua** |
| 7 | Desempate: menos cartas compradas | Desempate: **mais Kléos → quem tem Os Argonautas → menos Lendas → vitória compartilhada**, e só entre quem cumpre os requisitos |
| 8 | Se o gatilho ocorre, sempre completa-se a rodada | Se o disparador é o **último da ordem**, o jogo acaba **imediatamente** |

**Idêntico ao Splendor clássico** (não mexa): as quatro ações do turno, a exigência de pilha ≥4 para colher 2 iguais, o limite de 10 fichas ao fim do turno, o máximo de 3 cartas reservadas, o desconto por bônus permanente, a reposição imediata das fileiras, os espaços vazios permanentes quando o baralho esgota, e a estrutura 40/30/20 dos baralhos.
