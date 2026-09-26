import type { ClassDef, StatKey, Stats } from "./types";

type Row = {
  id: string;
  name: string;
  primary: StatKey;
  bonus: Partial<Stats>;
  passive: string;
  desc: string;
};

const rows: Row[] = [
  {
    id: "assassino",
    name: "Assassino",
    primary: "agi",
    bonus: { hp: 2, est: 4, atk: 3, agi: 5, int: 1 },
    passive: "Ponto Fraco",
    desc: "Ao atacar um inimigo pelas costas ou enquanto estiver em Furtividade, causa +25% de dano.",
  },

  {
    id: "berserk",
    name: "Berserk",
    primary: "atk",
    bonus: { hp: 6, est: 6, atk: 5, def: 1, agi: 2 },
    passive: "Fúria Crescente",
    desc: "A cada 10% de HP perdido, recebe +1 ATK. Ao chegar a 50% de HP, entra em Fúria Máxima, acumulando +5 ATK. O bônus não aumenta abaixo de 50% de HP.",
  },

  {
    id: "guerreiro",
    name: "Guerreiro",
    primary: "atk",
    bonus: { hp: 5, est: 4, atk: 4, def: 3, res: 1 },
    passive: "Postura de Combate",
    desc: "No início do turno escolhe uma postura: Ofensiva concede +2 ATK, Defensiva concede +2 DEF ou Mobilidade concede +2 AGI. A postura dura até o início do próximo turno.",
  },

  {
    id: "tank",
    name: "Tank",
    primary: "def",
    bonus: { hp: 10, est: 5, def: 6, res: 2, atk: 1 },
    passive: "Muralha",
    desc: "Quando um aliado próximo recebe dano, o Tank pode assumir 50% desse dano. Enquanto estiver na linha de frente, aliados próximos recebem +3 DEF.",
  },

  {
    id: "feiticeiro",
    name: "Feiticeiro",
    primary: "atkMgc",
    bonus: { mp: 8, atkMgc: 5, int: 3, res: 2 },
    passive: "Magic Booster",
    desc: "Cada skill utilizada concede +1 ATK MGC. Ao alcançar +5, ativa Descontrole de Mana: causa dano a todos na área igual ao MP restante e reseta os acúmulos.",
  },

  {
    id: "mago",
    name: "Mago",
    primary: "int",
    bonus: { mp: 10, atkMgc: 4, int: 5, res: 2 },
    passive: "Octagrama Arcano",
    desc: "Usar uma habilidade de afinidade diferente da anterior concede +1 stack. Ao alcançar 8 stacks, o próximo ataque ou habilidade causa +50% de dano mágico, aplica os efeitos das 8 afinidades e restaura 100% do MP. Depois, os stacks são resetados. As 8 afinidades são Água, Luz, Terra, Trevas, Vento, Fogo, Físico e Mágico.",
  },

  {
    id: "bufao",
    name: "Bufão",
    primary: "agi",
    bonus: { hp: 2, mp: 4, est: 4, agi: 4, int: 3 },
    passive: "Carta do Louco",
    desc: "Entra no combate com 1 stack. Cada stack concede +1 AGI. Ao alcançar 5 stacks, recebe +25% AGI e ativa automaticamente EXTREMISTA. EXTREMISTA converte a AGI em dano, causando 100% de ATK. Só pode ocorrer uma vez por batalha. Depois continua acumulando stacks e +1 AGI, mas não ativa EXTREMISTA novamente.",
  },

  {
    id: "alquimista",
    name: "Alquimista",
    primary: "int",
    bonus: { mp: 6, int: 4, atkMgc: 3, est: 2, hp: 2 },
    passive: "Preparação Alquímica",
    desc: "Seus ataques possuem 30% de chance de aplicar Veneno. Após acertar 3 vezes um inimigo envenenado, aplica Atordoamento. A contagem é resetada após o Atordoamento.",
  },

  {
    id: "arqueiro",
    name: "Arqueiro",
    primary: "agi",
    bonus: { hp: 2, est: 4, atk: 3, agi: 5 },
    passive: "Concentração Absoluta",
    desc: "Precisa acertar 2 ataques consecutivos para entrar em Concentração. Enquanto estiver concentrado, seus ataques recebem dano adicional multiplicado por 2. Um ataque normal causa 2x, um crítico de 2x causa 4x e um crítico de 3x causa 6x. A Concentração termina após o ataque.",
  },

  {
    id: "lanceiro",
    name: "Lanceiro",
    primary: "atk",
    bonus: {},
    passive: "Domínio da Lança",
    desc: "Enquanto um inimigo estiver dentro do alcance da lança, recebe +2 ATK. Se o inimigo entrar ou sair do alcance da lança, o próximo ataque causa +50% de dano.",
  },

  {
    id: "cacador",
    name: "Caçador",
    primary: "atk",
    bonus: { hp: 3, est: 5, atk: 4, agi: 3, int: 1 },
    passive: "Marca do Caçador",
    desc: "O primeiro ataque marca o alvo por 3 turnos. O alvo marcado recebe +20% de dano dos ataques do Caçador. Quando o alvo marcado é derrotado, o Caçador pode marcar outro imediatamente. Rastro de Sangue permite detectar inimigos escondidos com até 50% de HP, revelando sua localização através do rastro de sangue.",
  },

  {
    id: "clerigo",
    name: "Clérigo",
    primary: "res",
    bonus: { hp: 4, mp: 7, res: 4, int: 3, def: 2 },
    passive: "Bênção Sagrada",
    desc: "Uma habilidade de cura ou suporte concede 1 stack por 2 turnos. Cada stack concede +1 DEF e +1 RES. Ao alcançar 3 stacks, consome todos e cura 10% do HP máximo. Proteção Divina: se um aliado sob a bênção seria deixado com 20% ou menos de HP por um ataque, o Clérigo pode consumir 1 stack para reduzir o dano em 50%.",
  },

  {
    id: "necromante",
    name: "Necromante",
    primary: "atkMgc",
    bonus: { mp: 8, atkMgc: 4, int: 4, hp: 2, res: 1 },
    passive: "Servos da Morte",
    desc: "Pode coletar uma Alma do cadáver de um inimigo, obtendo 1 Alma por cadáver. Ao possuir 3 Almas, pode reviver um inimigo derrotado como Servo com 50% dos atributos anteriores, com máximo de 3 Servos. Ao alcançar 15 Almas, pode reviver 1 aliado derrotado com 10 HP. O máximo é 15 Almas. Se Ceifador ou Necromante coletar a Alma de um cadáver, ela desaparece para o outro.",
  },

  {
    id: "ceifador",
    name: "Ceifador",
    primary: "atk",
    bonus: {},
    passive: "Colheita Sombria",
    desc: "Ao desferir o golpe final em um inimigo, utiliza sua Alma para transformar o dano do golpe final em cura distribuída entre os aliados. Cada execução/cura concede +1 stack de Ceifador de Almas. Cada stack aumenta o dano em 50% por 2 turnos. Uma nova execução renova a duração, mas os bônus não acumulam. A Alma não pode ser coletada pelo Necromante.",
  },

  {
    id: "monge",
    name: "Monge",
    primary: "agi",
    bonus: { hp: 4, est: 6, atk: 3, agi: 4, def: 2 },
    passive: "Disciplina Corporal",
    desc: "A cada 3 ataques consecutivos recebe +1 Disciplina. Cada stack concede +1 AGI e +1 DEF. Ao alcançar 3 stacks, ativa Estado de Disciplina por 2 turnos, causando +20% de dano físico, e reseta os stacks. Meditação: o próximo ataque após Meditação recebe +50% do ATK como dano adicional e encerra o efeito.",
  },

  {
    id: "bardo",
    name: "Bardo",
    primary: "int",
    bonus: { mp: 5, est: 3, int: 4, agi: 3, hp: 2 },
    passive: "Sinfonia de Almanaque",
    desc: "Uma habilidade de suporte concede 1 stack aos aliados dentro da área de influência por 2 turnos. Cada stack concede +1 em todos os atributos. Ao alcançar 3 stacks, ativa Harmonia por 2 turnos, concedendo +20% de dano e +20% de resistência. Os stacks são resetados ao ativar Harmonia.",
  },

  {
    id: "invocador",
    name: "Invocador",
    primary: "int",
    bonus: { mp: 8, atkMgc: 3, int: 5, res: 2, hp: 1 },
    passive: "Vínculo de Invocação",
    desc: "Invocar uma criatura diferente da anterior concede +1 stack. Ao alcançar 5 stacks e possuir nível 20, desbloqueia ALEISTER, AQUELE QUE INVOKA. A invocação especial recebe o dobro dos atributos básicos atuais do Invocador: ATK, ATK MGC, AGI, DEF, RES e INT.",
  },

  {
    id: "oraculo",
    name: "Oráculo",
    primary: "int",
    bonus: { mp: 7, int: 5, res: 3, atkMgc: 2, hp: 1 },
    passive: "Presságio",
    desc: "Antes da batalha pode utilizar Premonição para entrar em Preparação, impedindo ser surpreendido ou emboscado por classes ou raças furtivas/ranged. Durante a batalha, prever a ação de um inimigo concede +1 stack. Ao alcançar 3 stacks, consome todos para prever o próximo ataque inimigo e evitá-lo automaticamente.",
  },

  {
    id: "druida",
    name: "Druida",
    primary: "res",
    bonus: { hp: 4, mp: 6, res: 3, int: 3, agi: 2 },
    passive: "Comunhão Natural",
    desc: "Em terreno natural recebe +2 DEF e +2 RES. Utilizar uma habilidade da natureza concede +1 stack. Ao alcançar 3 stacks, ativa Comunhão com a Natureza, restaurando 10% do HP máximo e 10% do MP máximo e concedendo +2 INT por 2 turnos. Depois, reseta os stacks.",
  },

  {
    id: "artifice",
    name: "Artífice",
    primary: "int",
    bonus: {},
    passive: "Mestre das Criações",
    desc: "Pode criar 3 projetos diferentes utilizando seus próprios atributos e recursos. Projeto 1 possui 1/3 dos atributos básicos, HP e MP. Projeto 2 possui 2/3. Projeto 3 possui 100% dos atributos básicos, 90% HP e 90% MP. Após completar os 3, desbloqueia a 4ª criação: Engenhoca Viva, com atributos básicos iguais aos do Artífice +75% dos atributos básicos, totalizando 175%, além de 100% HP e 100% MP.",
  },

  {
    id: "duelista",
    name: "Duelista",
    primary: "atk",
    bonus: { hp: 3, est: 5, atk: 4, agi: 4, def: 1 },
    passive: "Domínio do Duelo",
    desc: "Cada acerto concede +1 stack. Ao alcançar 3 stacks, puxa o inimigo para um Domínio separado de duelo. Pode criar 1 Clone com 50% dos atributos do Duelista. O combate pode ser 2x1, 2x2 ou 3x1. Se Original ou Clone for derrotado, o sobrevivente torna-se o Original e recupera seus atributos normais. A vitória reseta os stacks. Na próxima ativação pode levar até 2 personagens atingidos. Se o Duelista perder, seu EST chega a 0, ficando fora de combate e vulnerável. Não possui ATK MGC; habilidades utilizam EST, exceto ataques combinados mágicos.",
  },

  {
    id: "buffer-healer",
    name: "BUFFER/HEALER",
    primary: "res",
    bonus: {},
    passive: "Ressonância Vital",
    desc: "Cada cura ou buff concede +1 stack. Cada stack aumenta em 10% a eficiência de cura ou buff. Ao alcançar 3 stacks, ativa Ressonância Máxima por 2 turnos: curas restauram 5% do MP do alvo e buffs concedem +1 DEF e +1 RES. Após 2 turnos, os stacks são resetados.",
  },

  {
    id: "paladino",
    name: "Paladino",
    primary: "res",
    bonus: { hp: 6, mp: 4, def: 3, res: 4, atk: 2 },
    passive: "Juramento Sagrado",
    desc: "No início do combate escolhe 1 aliado. 20% do dano recebido pelo aliado é transferido para o Paladino. Cada dano recebido pelo juramento concede +1 Fé. Ao alcançar 3 Fé, consome os stacks e ativa Estado Sagrado por 4 turnos, concedendo +3 DEF, +3 RES e restaurando 5% do HP máximo por turno.",
  },

  {
    id: "bruxo",
    name: "Bruxo",
    primary: "atkMgc",
    bonus: { mp: 7, atkMgc: 5, int: 3, hp: 2, res: 1 },
    passive: "Pacto Profano",
    desc: "Ao utilizar uma habilidade pode consumir 10% do HP atual. Habilidades ofensivas causam +25% de dano e habilidades de suporte ou controle recebem +25% de efeito. Cada sacrifício concede +1 marca de Pacto. Ao alcançar 5 marcas, ativa Pacto Completo por 3 turnos, concedendo +3 ATK MGC e +3 RES. As marcas são resetadas após o estado.",
  },

  {
    id: "ronin",
    name: "Ronin",
    primary: "atk",
    bonus: {},
    passive: "Caminho do Ronin",
    desc: "Se não realizar ataques durante o turno, entra em Postura de Espera. O próximo ataque causa +50% de dano. Se o alvo estiver com 30% ou menos de HP, o ataque é crítico garantido. A postura termina após o ataque. Vingança dos 47: se um aliado for derrotado, escolhe o inimigo responsável e causa +25% de dano contra ele. A Postura de Espera não pode ser interrompida por provocação ou distração até o alvo ser derrotado.",
  },

  {
    id: "espadachim",
    name: "Espadachim",
    primary: "atk",
    bonus: { hp: 3, est: 5, atk: 4, agi: 4, def: 1 },
    passive: "Espadachim Silencioso",
    desc: "Cada turno em combate concede +1 ATK. Ao alcançar 5 turnos, sua espada desperta, concedendo +25% de dano físico pelo restante da batalha. Após despertar, cada ataque bem-sucedido concede +1 stack, com cada stack concedendo +1 ATK. Máximo de 7 stacks.",
  },

  {
    id: "xama",
    name: "Xamã",
    primary: "int",
    bonus: { mp: 6, atkMgc: 3, int: 4, res: 3, hp: 2 },
    passive: "Pacto dos Espíritos",
    desc: "Antes da batalha escolhe permanentemente 1 Espírito Ancestral. Fera/Instinto Predador: ataques contra inimigos com 50% ou menos de HP causam +30% de dano. Guardião/Proteção Ancestral: um ataque que reduziria o HP do Xamã para 30% ou menos tem o dano reduzido em 40%. Elemental/Fúria Elemental: habilidades de afinidade causam +20% de dano mágico.",
  },

  {
    id: "runomante",
    name: "Runomante",
    primary: "int",
    bonus: { mp: 7, atkMgc: 3, int: 5, res: 3, hp: 1 },
    passive: "Runa Primordial",
    desc: "Possui 8 runas elementais correspondentes às afinidades. Cada habilidade de afinidade diferente da anterior concede +1 stack correspondente. Cada stack representa uma runa elemental. Ao completar as 8, o próximo ataque ou habilidade recebe Efeito da Morte, causando dano adicional equivalente a 30% do HP atual do alvo. Consome as 8 runas e reinicia.",
  },

  {
    id: "dancarino-de-laminas",
    name: "Dançarino de Lâminas",
    primary: "agi",
    bonus: {},
    passive: "Dança da Morte",
    desc: "Mover-se durante o turno concede +2 AGI. Ataques realizados após se mover permitem continuar o movimento imediatamente. Se acertar 3 inimigos diferentes no mesmo turno, ativa Dança da Morte por 2 turnos, concedendo +30% de dano físico, +2 AGI e imunidade a efeitos negativos que afetem ou reduzam AGI. Após terminar, pode reativar no próximo turno depois de acertar 3 inimigos diferentes.",
  },

  {
    id: "cryomante",
    name: "Cryomante",
    primary: "atkMgc",
    bonus: {},
    passive: "Coração Glacial",
    desc: "Cada dano causado com Gelo ou Água aplica 1 Congelamento. Ao alcançar 3 Congelamentos, o alvo fica Congelado por 1 turno, não podendo agir ou se mover. Depois entra em Resfriado por 2 turnos, recebendo -2 AGI. O mesmo alvo só pode ser Congelado novamente depois que o Resfriado terminar.",
  },

  {
    id: "batedor",
    name: "Batedor",
    primary: "agi",
    bonus: {},
    passive: "Olhos do Predador",
    desc: "Detecta inimigos escondidos, camuflados ou invisíveis dentro do alcance. Se detectar um inimigo que ainda não tenha sido detectado pelos aliados, revela sua posição aos aliados próximos por 2 turnos. Ataques contra inimigos revelados pelo Batedor causam +20% de dano. Não sofre penalidade de precisão contra inimigos escondidos.",
  },

  {
    id: "gladiador",
    name: "Gladiador",
    primary: "atk",
    bonus: { hp: 5, est: 5, atk: 4, def: 3, agi: 2 },
    passive: "Arena Sangrenta",
    desc: "Ao entrar no combate escolhe 1 inimigo como Adversário. Enquanto luta contra ele recebe +2 ATK, +2 DEF e +20% de dano de ataque. Se o Adversário for derrotado, pode escolher outro. Enquanto luta contra o Adversário, não pode receber bônus provenientes de outros inimigos.",
  },

  {
    id: "cavaleiro",
    name: "Cavaleiro",
    primary: "def",
    bonus: { hp: 7, est: 4, atk: 3, def: 5, res: 1 },
    passive: "Investida Montada",
    desc: "No início do turno, após realizar o movimento mínimo necessário, pode executar uma Investida. O próximo ataque recebe +50% de dano e empurra o alvo. Se o alvo colidir com outro inimigo ou obstáculo, ambos recebem dano adicional equivalente a 20% do ATK do Cavaleiro. Só pode realizar outra Investida no próximo turno.",
  },

  {
    id: "cavaleiro-celeste",
    name: "Cavaleiro Celeste",
    primary: "agi",
    bonus: {},
    passive: "Ascensão Celestial",
    desc: "No início do combate pode ascender e ficar no ar. Enquanto estiver aéreo recebe +2 AGI e ataques corpo a corpo de inimigos no chão causam -30% de dano. Uma vez por turno pode utilizar Descida Celestial, realizando um ataque aéreo com +30% de dano e retornando ao chão.",
  },

  {
    id: "elementalista",
    name: "Elementalista",
    primary: "atkMgc",
    bonus: { mp: 8, atkMgc: 5, int: 3, res: 2 },
    passive: "Convergência Elemental",
    desc: "Pode utilizar as 8 afinidades. Utilizar uma afinidade diferente da anterior concede +10% de efeito no próximo ataque ou habilidade. Ao utilizar 4 afinidades diferentes consecutivamente, ativa Convergência por 2 turnos, concedendo +20% de dano mágico. Habilidades de afinidade podem aplicar simultaneamente o efeito da afinidade atual e da afinidade anterior. A sequência é resetada após a Convergência.",
  },

  {
    id: "anatomista",
    name: "Anatomista",
    primary: "int",
    bonus: {},
    passive: "Anatomia Perfeita",
    desc: "Pode identificar pontos vulneráveis. Após atingir o mesmo inimigo 3 vezes, revela seu Ponto Vital por 2 turnos. Ataques contra o Ponto Vital causam +25% de dano. Acertar o Ponto Vital reseta a contagem. Apenas 1 Ponto Vital pode permanecer ativo.",
  },

  {
    id: "domador",
    name: "Domador",
    primary: "int",
    bonus: { hp: 4, est: 4, int: 3, agi: 3, atk: 2 },
    passive: "Laço Bestial",
    desc: "Pode criar um vínculo com 1 criatura aliada. O Domador compartilha 20% do dano recebido com a criatura. Enquanto estiverem próximos, recebe +2 AGI. Se a criatura for derrotada, ativa Fúria de Domador por 3 turnos, concedendo +3 ATK e +3 AGI. O vínculo só pode ser estabelecido novamente após o combate.",
  },

  {
    id: "pugilista",
    name: "Pugilista",
    primary: "atk",
    bonus: {},
    passive: "Punhos de Ferro",
    desc: "Não utiliza armas para ataques físicos. Ataques consecutivos sem utilizar habilidades tornam os golpes mais rápidos. A partir do 3º ataque recebe +2 AGI. A partir do 5º recebe +2 ATK. Não atacar durante um turno reseta a sequência. Ao alcançar 5 ataques, o próximo ataque causa +45% de dano e encerra a sequência.",
  },

  {
    id: "cronomante",
    name: "Cronomante",
    primary: "int",
    bonus: {},
    passive: "Distorção Temporal",
    desc: "Uma vez por combate, quando o Cronomante ou um aliado próximo for atacado e ficar com 30% ou menos de HP, pode ativar Retrocesso Temporal. O alvo retorna aos valores de HP, MP e EST que possuía no início do turno anterior. O efeito não desfaz ações, efeitos ou posições de outros personagens. A passiva termina após ser utilizada.",
  },

  {
    id: "alquimista-sombrio",
    name: "Alquimista Sombrio",
    primary: "atkMgc",
    bonus: {},
    passive: "Transmutação Profana",
    desc: "Pode converter o próprio HP. Uma habilidade pode sacrificar 5% do HP máximo. Habilidades ofensivas causam +25% de dano e habilidades de suporte ou controle recebem +25% de efeito. Se o sacrifício deixar o Alquimista Sombrio com 20% ou menos de HP, ativa Alquimia Profana, concedendo +3 ATK MGC e +3 INT enquanto permanecer com 20% ou menos de HP. O efeito termina ao ultrapassar 20%. Corrosão Profana: ao envenenar um inimigo, os próximos 2 ataques bem-sucedidos contra ele aplicam Corrosão por 2 turnos. Um alvo corroído perde 4 HP por turno e não pode remover a Corrosão através de limpeza de debuff.",
  },

  {
    id: "mestre-de-marionetes",
    name: "Mestre de Marionetes",
    primary: "int",
    bonus: {},
    passive: "Fios do Destino",
    desc: "A Marionete é sua principal arma e é controlada por fios. Ela age sob o comando do Mestre de Marionetes. Pode criar um vínculo com um inimigo dentro do alcance. 20% do dano causado ao Mestre de Marionetes é transferido ao alvo vinculado. Apenas 1 Marionete pode estar ativa. Marionete Sombraneco: após perder a Marionete, pode escolher um inimigo e utilizar sua sombra para imobilizá-lo por 1 turno.",
  },

  {
    id: "armadilheiro",
    name: "Armadilheiro",
    primary: "agi",
    bonus: {},
    passive: "Armadilha Mortal",
    desc: "Pode preparar armadilhas escondidas. Ao ativar uma armadilha escolhe: Explosiva, causando 25% do ATK do Armadilheiro; Imobilizadora, reduzindo AGI em 4 por 2 turnos; ou Serrilha, causando Sangramento por 2 turnos. Pode manter no máximo 3 armadilhas. Após ativadas, são destruídas.",
  },

  {
    id: "ilusionista",
    name: "Ilusionista",
    primary: "int",
    bonus: { mp: 8, atkMgc: 4, int: 5, agi: 2, res: 1 },
    passive: "Inversão Sensorial",
    desc: "Ao atingir um inimigo pode aplicar uma inversão da percepção, trocando esquerda/direita, frente/trás ou acima/abaixo por 2 turnos. Um novo ataque renova a duração. Apenas 1 inimigo pode permanecer afetado. Mundo Invertido: após ativar Inversão Sensorial em 4 inimigos diferentes, pode inverter seus atributos básicos: ATK ↔ DEF, ATK MGC ↔ RES e AGI ↔ INT. Os valores são trocados, sem alterar permanentemente os atributos-base.",
  },
];

export const CLASSES: ClassDef[] = rows.map((r) => ({
  id: r.id,
  name: r.name,
  primary: r.primary,
  bonus: r.bonus,
  passive: {
    name: r.passive,
    description: r.desc,
  },
}));

export const CLASS_BY_ID = Object.fromEntries(
  CLASSES.map((c) => [c.id, c])
) as Record<string, ClassDef>;
