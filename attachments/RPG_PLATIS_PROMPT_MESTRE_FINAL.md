# RPG PLATIS — PROMPT MESTRE FINAL (FUNCIONAL PARA GROK BUILDER)

**Versão Oficial Consolidada**  
Fontes: `rpg.txt` (principal) + `rpg_atualizado (4).txt` + especificações de interface, mapa hierárquico e cards interativos.

### NÚMEROS OFICIAIS DO SISTEMA
- **25 Raças** (apenas 5 Basic selecionáveis no início)
- **43 Classes**
- **8 Afinidades**
- **8 Brasões**
- **9 Níveis de Brasão** (0 = Sem Brasão → 8 = Brasão Extra)
- **22 Continentes**
- **11 Bosses Mundiais**
- **2390 Dungeons**

---

## REGRAS FUNDAMENTAIS DE IMPLEMENTAÇÃO

- Não inventar regras novas.
- Não alterar nomes, valores, porcentagens, stacks, durações ou condições já definidos.
- Preservar a arquitetura existente (Supabase, Auth, Mesa Online).
- Separação clara: **PERSONAGEM | EQUIPAMENTO | BRASÃO | COMBATE | MUNDO | MESTRE**.
- Tudo deve ser visualmente interativo e responsivo (mobile + desktop).
- **Supabase Realtime obrigatório** (não usar Ably).
- Cliente nunca é autoridade final. Validações importantes no backend/RLS.

---

## 1. SISTEMA DE RAÇAS (25 RAÇAS)

### Disponibilidade na Criação
- **Apenas 5 raças Basic** podem ser selecionadas no início:  
  **Humano, Meio-elfo, Elfo, Semi-besta, Besta**
- As demais (Rare, Legendary, Extreme) ficam **bloqueadas** e só são desbloqueadas por missões oficiais.
- **Raças Extra** (Doppelganger e Kitsune) **somente o Mestre** pode desbloquear.

### Lista Oficial de Raças e Passivas

**BASIC (selecionáveis)**
1. **Humano** — Adaptatividade  
   Ao sofrer um efeito negativo pela primeira vez, adapta-se. Na próxima aplicação do mesmo efeito, duração reduzida em 1 turno.

2. **Meio-elfo** — Atordoamento Élfico  
   Ataques e habilidades: 20% chance de Stun.

3. **Elfo** — Atordoamento Ancestral  
   Ataques e habilidades: 40% chance de Stun.

4. **Semi-besta** — Frenesi Controlado  
   ≤50% HP → +2 AGI até o fim do combate.

5. **Besta** — Frenesi  
   ≤50% HP → +3 ATK até o fim do combate.

**RARE (missões de desbloqueio)**
6. **Lizard** — Escamas de Aço → Recebe 10% menos dano físico.  
7. **Aqua** — Selos do Além → 20% chance de aplicar Selo do Além (−10% recuperação de HP do alvo por 2 turnos).  
8. **Morto-vivo** — Criação Indesejada → Ao receber dano que levaria a 0 HP: 20% chance de permanecer com 1 HP.  
9. **Demônio** — Injustiça Benigna → 20% chance de ignorar completamente um efeito negativo.  
10. **Divino** — Justiça Maldita → 20% chance de refletir efeito negativo de volta.  
11. **Dríade** — Floresta da Vida → Em terreno natural: recupera 2% do HP máximo por turno.  
12. **Lupino** — Instinto de Matilha → ≥1 aliado próximo → +2 AGI.  
13. **Anão** — Constituição Anã → Ao receber ataque que reduziria HP para ≤50%: +2 DEF até o fim do combate.  
14. **Orc** — Fúria Orc → Ao entrar na batalha: todos com nível ≤ ao do Orc perdem −1 em todos os atributos.  
15. **Goblin** — Oportunista → Ao atacar inimigo com ≤50% HP: +20% dano.  
16. **Oni** — Presença Demoníaca → Inimigos próximos sofrem −2 DEF.  
17. **Gigante** — Força Colossal → Ataques básicos: 20% chance de Stun.  
18. **Quimera** — Mutação → No início da batalha: +2 em um atributo aleatório.  
19. **Homúnculo** — Corpo Artificial → Ao ser derrotado: não morre nem concede XP. Fica em Stun. Ao ser tocado, é reativado.

**LEGENDARY**
20. **Dragonoide** — Dragon's Finger  
    40% chance de aplicar 1 Marca Dracônica. Ao 3 Marcas: consome e causa dano adicional = 25% do ATK. Pode acumular novamente.

21. **Umbral**  
    - Corpo Umbral: área escura → invisível por 1 turno.  
    - Forma da Marca do Vazio: ≤50% HP → forma de sombra por 2 turnos (incapaz de ser atacada).  
    - Marca do Vazio: aplica 1 Marca Umbral. Ao 3 → Cego por 1 turno.

**EXTREME**
22. **Vampiro** — Blood Hugh  
    3 Blood. Cada habilidade base concede 1 Blood. Ao 3 Blood: estado máximo de regeneração. Ataques básicos com Sangramento recuperam 50% do dano em HP.

23. **Fae**  
    - Sorte Feérica: 20% chance de transformar efeito negativo em positivo.  
    - Travessura: 20% chance de evitar completamente o ataque.  
    - Frenesi Maluco: ao entrar na batalha → +2 AGI e +2 ATK (mantém controle).

**EXTRA (somente Mestre)**
24. **Doppelganger** — Assimilação  
    1 Stack de Copy por turno. Ao 5 Stacks (1× por batalha): assimila personagem/monstro (até +10 níveis). Assume valores, classe, habilidades e passivas. Termina quando HP/MP/EST = 0. Não copia equipamentos/inventário.

25. **Kitsune** — Mestre Ilusionista / Cartas do Além  
    1 Stack de Ilusão por turno de ataques → ao 3 cria Ilusão (não pode ser atacada). Quando Ilusão é atacada → começa Stacks do Além. Ao 3 Stacks → imune aos próximos 2 ataques.  
    **Kitsune + Bufão**: Clones também acumulam Stacks. Unidades = 1 + clones.

### Valores-base oficiais (já com +7 HP / +8 MP / +10 EST)
| Raça       | HP  | MP  | EST | San | ATK | ATK MGC | DEF | RES | AGI | INT |
|------------|-----|-----|-----|-----|-----|---------|-----|-----|-----|-----|
| Humano     | 32  | 23  | 40  | 100 | 4   | 4       | 8   | 8   | 8   | 15  |
| Meio-elfo  | 30  | 30  | 35  | 100 | 3   | 7       | 6   | 9   | 10  | 15  |
| Elfo       | 29  | 33  | 35  | 100 | 3   | 8       | 5   | 9   | 12  | 16  |
| Semi-besta | 37  | 18  | 45  | 90  | 9   | 3       | 7   | 6   | 10  | 10  |
| Besta      | 42  | 16  | 50  | 80  | 11  | 2       | 6   | 5   | 9   | 6   |

---

## 2. SISTEMA DE CLASSES (43 CLASSES)

STATUS FINAL = Base Racial + Bônus da Classe.

Todas as 43 classes e passivas oficiais devem ser implementadas **exatamente** como definidas (Assassino → Ilusionista).  
A passiva de classe é oficial e não pode ser editada pelo jogador.

Principais classes e passivas (lista completa deve ser preservada):
- Assassino — Ponto Fraco (+25% dano pelas costas/furtividade)
- Berserk — Fúria Crescente
- Guerreiro — Postura de Combate
- Tank — Muralha
- Feiticeiro — Magic Booster
- Mago — Octagrama Arcano
- Bufão — Carta do Louco + EXTREMISTA
- Alquimista — Preparação Alquímica
- Arqueiro — Concentração Absoluta
- ... (até Ilusionista — Inversão Sensorial)

---

## 3. AFINIDADES (8) — EFEITO VISUAL NO CARD

| Afinidade | Símbolo | Cor do Card          | Efeito Visual                          |
|-----------|---------|----------------------|----------------------------------------|
| Fogo      | 🔥      | Vermelho / Laranja   | Chamas animadas + brilho quente        |
| Água      | 💧      | Azul / Ciano         | Ondas fluidas + reflexo líquido        |
| Terra     | 🪨      | Marrom / Verde terra | Textura de pedra + partículas          |
| Vento     | 🌪️      | Verde-claro / Branco | Linhas de vento + folhas flutuando     |
| Luz       | ☀️      | Dourado / Branco     | Halo luminoso + brilho sagrado         |
| Trevas    | 🌑      | Roxo-escuro / Preto  | Sombras pulsantes + partículas escuras |
| Físico    | ⚔️      | Cinza metálico       | Brilho de metal + faíscas              |
| Mágico    | ✨      | Roxo / Rosa mágico   | Partículas mágicas + runas flutuantes  |

**Regra visual obrigatória**: Ao escolher a Afinidade, o card muda de cor e recebe o efeito visual. O símbolo do Brasão daquela afinidade aparece automaticamente.

---

## 4. CRIAÇÃO DE PERSONAGEM

Jogador e Mestre podem escolher livremente (respeitando bloqueios):

1. Raça (apenas 5 Basic no início)
2. Classe (qualquer das 43)
3. Afinidade (muda cor e efeito do card)
4. Nome
5. Imagem (upload do dispositivo / URL / padrão)

O sistema calcula automaticamente STATUS FINAL = Base Racial + Bônus de Classe.  
Personagem começa no Nível 1, Sem Brasão, 3 slots de habilidade.

---

## 5. CARD DE PERSONAGEM — INTERATIVO

Elementos obrigatórios:
- Imagem grande e interativa (dispositivo ou URL)
- Nome, Nível, Raça, Classe, Afinidade (com símbolo)
- Barras animadas de HP / MP / EST / Sanidade
- Atributos com bônus visíveis
- 3 Passivas (Classe + Raça + Personagem) com stacks visuais
- 3 Habilidades (ou 4 com Brasão Grande) com status de aprovação
- Brasão atual + XP + efeito ativo
- XP do Personagem + pontos disponíveis
- Cor e efeitos mudam conforme a Afinidade
- Símbolo do Brasão da afinidade aparece automaticamente

**Mestre**: possui card próprio + **8 slots de jogadores** visíveis na Mesa.

---

## 6. SISTEMA DE HABILIDADES (3 SLOTS)

Cada personagem possui exatamente 3 habilidades (4ª com Brasão Grande).

### Criação (pelo Jogador)
- Nome, Descrição, Imagem
- **Tipo**: Buff / Debuff / Heal / Ataque / Ataque Mágico
- Custo (HP / MP / EST)
- **Alvo**: único ou área (escolher quantidade de inimigos)
- **Área em quadrados menores** + direção (cima / baixo / lados / diagonal / personalizado)
- Alcance, efeitos, duração, cooldown

### Fluxo de Aprovação
```
DRAFT → PENDING → Mestre (Aprova / Edita / Recusa) → APPROVED ou REJECTED
```
Edição de APPROVED volta automaticamente para PENDING.

---

## 7. SISTEMA DE MAPA HIERÁRQUICO (22 CONTINENTES)

- **Mapa-Múndi** → 22 continentes.
- Ao clicar em um continente → abre grade lógica **2000 × 3000**.
- **Ao dar zoom / abrir uma célula**: cada uma das 2000×3000 células pode ser expandida em uma **nova grade interna de 2000 × 3000**.
- Coordenadas sempre lógicas (x, y). Nunca salvar em pixels.
- Miniaturas usam a imagem real do personagem.
- Movimento 4 direções (diagonal preparada).
- Distância Manhattan.
- Supabase Realtime obrigatório.

**Mestre pode**: mostrar grade, centralizar, bloquear/liberar movimento, teleportar, ocultar/revelar, criar entidades.

---

## 8. SISTEMA DE COMBATE

### Dados 3D
Rolagem com animação 3D realista.  
Dados: D4, D6, D8, D10, D12, D15, D20, D50, D100 + personalizados.

### Resolução
1. Atacante e Defensor rolam D20.
2. Acerto: D20 atacante > D20 defensor.
3. Empate → ATK vs DEF (físico) ou ATK MGC vs RES (mágico). Ainda empate → RES → INT → EST.
4. Crítico: 15–19 = ×2 | 20 = ×3.
5. Dado de dano: D[ATK] ou D[ATK MGC]. Habilidades ofensivas: 2 + D[atributo].
6. Contra-ataque: somente se D20 do defensor ≥ 17 **e** maior que o do atacante.  
   - Contra-atacar (−3 EST, sem crítico)  
   - Esquivar/Defender (0 EST)

### XP de Combate
O Mestre define a quantidade de XP oferecida.

### Motor Único
CONDIÇÃO → GATILHO → CÁLCULO → MODIFICADORES → RESULTADO

---

## 9. BOSSES MUNDIAIS (11)

| Boss              | Símbolo | Brasão              | Bônus   |
|-------------------|---------|---------------------|---------|
| Hræsvelgr         | 🌪️      | 🌪️ Vento            | +50%    |
| Skoll & Hati      | ☀️🌑    | ☀️ Luz + 🌑 Trevas  | +100%*  |
| Eikthyrnir        | 🪨      | 🪨 Terra            | +50%    |
| Ratatoskr         | 🔮      | 🔮 Mágico           | +50%    |
| Jormungandr       | 🌊      | 🌊 Água             | +50%    |
| Raiju             | ⚡      | 🔥 Fogo             | +50%    |
| Fenrir            | ⚔️      | ⚔️ Físico           | +50%    |
| Ammit / Camazotz / Tsuchigumo / Wendigo | — | — | 0% |

*Skoll e Hati recebem +100% individualmente.  
Bosses permanecem no mundo após derrota. Progressão: Lv.12 → 100 → 200 → 300 → 400.

**Mestre pode criar** monstros, hordas e Bosses personalizados.

---

## 10. BRASÕES DO PLAYER (9 NÍVEIS)

| XP     | Nível     | Efeito                          |
|--------|-----------|---------------------------------|
| 0      | 0 – Sem   | —                               |
| 3.000  | 1 – Inicial | +2% status principal da Classe |
| 6.000  | 2 – Leve  | +5% status principal            |
| 9.000  | 3 – Pequeno | +7% status principal          |
| 12.000 | 4 – Médio | −20% Cooldown                   |
| 15.000 | 5 – Pesado | +25% todos os status           |
| 18.000 | 6 – Grande | +1 Skill (4ª habilidade)       |
| 23.000 | 7 – Arcano | +50% todos os status           |
| 30.000 | 8 – Extra | Tenta invocar o Guardião        |

XP de Brasão é cumulativo e separado do XP de nível. Somente o maior nível ativo.

---

## 11. PROGRESSÃO DO JOGADOR

- Nível máximo: **150**
- A cada nível: **+3 pontos de atributo** + **+2 Sanidade**
- A cada 5 níveis: **+8 pontos** para distribuir entre HP / MP / EST
- Inventário: 20 slots iniciais +10 a cada 5 níveis

---

## 12. SISTEMA DE DUNGEONS (2390)

- 2390 dungeons espalhadas pelos 22 continentes.
- Fixas ou procedurais.
- Mestre pode criar novas.
- Exploração revela somente o caminho percorrido.
- Armadilhas usam Click Timer Event.
- Ao concluir: jogadores são expulsos e a dungeon reseta mais difícil.

---

## 13. INVENTÁRIO E ECONOMIA

- 5 slots de equipamento: Arma, Armadura, Botas, Relíquia, Colar.
- Moedas: 1 Gold = 100 Silver = 10.000 Bronze | 1 Platinum = 1.000 Gold.
- Mystery Box: 40 Silver.

---

## 14. INTERFACE INTERATIVA

**Player**: Card de personagem (cor + efeitos da Afinidade), 3 habilidades, passivas com stacks, miniatura no mapa, chat.

**Mestre**: Card próprio + **8 slots de jogadores**, painel de criação de monstros/hordas/Bosses/dungeons, ferramentas de mapa, aprovação de habilidades/passivas, controle de XP.

---

## 15. PERSISTÊNCIA E REALTIME

- Supabase Realtime obrigatório.
- Sessão não fecha em desconexão.
- Ao reconectar: recupera estado completo.
- Backups automáticos.

---

## 16. REGRA CENTRAL FINAL

O RPG Platis deve manter separação clara:

**PERSONAGEM** → raça, classe, afinidade, atributos, passivas, imagem, card dinâmico  
**EQUIPAMENTO** → economia, dungeons, quests, recompensas  
**BRASÃO** → 9 níveis independentes  
**COMBATE** → D20, dados 3D, reações, stacks visuais  
**MUNDO** → 22 continentes, grades hierárquicas 2000×3000, 2390 dungeons, 11 Bosses  
**MESTRE** → autoridade final + 8 slots de jogadores + criação de conteúdo  

Não criar regras novas sem autorização.  
Não substituir regras confirmadas.

---

**Este é o prompt oficial consolidado e pronto para o Grok Builder.**
