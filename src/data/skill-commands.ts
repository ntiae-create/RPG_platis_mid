export type SkillCommandCategory =
  | "dano"
  | "debuff"
  | "buff"
  | "cura"
  | "controle"
  | "utilidade";

export interface SkillCommandDefinition {
  command: string;
  category: SkillCommandCategory;
  syntax: string;
  description: string;
  parameters: string[];
  status: "documentado" | "planejado";
}

export const SKILL_COMMANDS: SkillCommandDefinition[] = [
  {
    command: "/sangramento",
    category: "debuff",
    syntax: "/sangramento [2d5] duração=3",
    description: "Aplica sangramento. O valor, a duração e as regras de dano precisam ser definidos.",
    parameters: ["dados", "duração"],
    status: "documentado",
  },
  {
    command: "/congelamento",
    category: "controle",
    syntax: "/congelamento duração=1",
    description: "Aplica congelamento. As restrições de movimento ou ação dependem das regras definidas.",
    parameters: ["duração", "intensidade"],
    status: "documentado",
  },
  {
    command: "/lentidão",
    category: "debuff",
    syntax: "/lentidão duração=2",
    description: "Reduz a capacidade de movimento ou velocidade do alvo conforme os parâmetros definidos.",
    parameters: ["intensidade", "duração"],
    status: "documentado",
  },
  {
    command: "/veneno",
    category: "debuff",
    syntax: "/veneno [2d5] duração=3",
    description: "Aplica veneno. Dano periódico, duração e aplicação serão validados pelas regras do efeito.",
    parameters: ["dados", "duração"],
    status: "documentado",
  },
  {
    command: "/queimadura",
    category: "debuff",
    syntax: "/queimadura [2d5] duração=3",
    description: "Aplica queimadura, com dano e duração definidos pelos parâmetros válidos.",
    parameters: ["dados", "duração"],
    status: "documentado",
  },
  {
    command: "/combustão",
    category: "dano",
    syntax: "/combustão [4d5]",
    description: "Representa um efeito de combustão. Área, dano e interação com outros efeitos precisam ser especificados.",
    parameters: ["dados", "área"],
    status: "documentado",
  },
  {
    command: "/cegueira",
    category: "debuff",
    syntax: "/cegueira duração=2",
    description: "Aplica cegueira conforme as regras de precisão e percepção que forem definidas.",
    parameters: ["duração", "intensidade"],
    status: "documentado",
  },
  {
    command: "/fraqueza",
    category: "debuff",
    syntax: "/fraqueza duração=2",
    description: "Reduz um ou mais atributos conforme os parâmetros permitidos.",
    parameters: ["atributo", "valor", "duração"],
    status: "documentado",
  },
  {
    command: "/cancelamento",
    category: "utilidade",
    syntax: "/cancelamento efeito=nome",
    description: "Cancela um efeito ou uma habilidade quando as condições definidas permitirem.",
    parameters: ["efeito", "alvo"],
    status: "documentado",
  },
  {
    command: "/limpeza",
    category: "utilidade",
    syntax: "/limpeza efeito=nome",
    description: "Remove efeitos negativos elegíveis conforme as regras definidas.",
    parameters: ["efeito", "alvo"],
    status: "documentado",
  },
  {
    command: "/explosão",
    category: "dano",
    syntax: "/explosão [4d5]",
    description: "Causa dano explosivo. Área e seleção de alvos devem ser especificadas quando necessárias.",
    parameters: ["dados", "área", "alvos"],
    status: "documentado",
  },
  {
    command: "/regeneração",
    category: "cura",
    syntax: "/regeneração [2d5] duração=3",
    description: "Recupera vida ao longo de um período. Deve indicar quando a recuperação acontece.",
    parameters: ["dados", "duração", "frequência"],
    status: "documentado",
  },
  {
    command: "/fortalecimento",
    category: "buff",
    syntax: "/fortalecimento {+2 ATK}",
    description: "Aumenta atributos ou capacidades. O atributo, o valor e a duração devem ser válidos.",
    parameters: ["atributo", "valor", "duração"],
    status: "documentado",
  },
  {
    command: "/heal",
    category: "cura",
    syntax: "/heal [4d5]",
    description: "Recupera vida. O alvo e a quantidade recuperada são definidos pela configuração.",
    parameters: ["dados", "alvo"],
    status: "documentado",
  },
  {
    command: "/cura",
    category: "cura",
    syntax: "/cura [4d5]",
    description: "Nome alternativo proposto para cura; ainda precisa ser associado oficialmente ao comando /heal.",
    parameters: ["dados", "alvo"],
    status: "planejado",
  },
  {
    command: "/dano",
    category: "dano",
    syntax: "/dano [2d5]",
    description: "Representa dano genérico quando nenhum tipo específico for necessário.",
    parameters: ["dados", "tipo", "alvo"],
    status: "planejado",
  },
  {
    command: "/buff",
    category: "buff",
    syntax: "/buff {+2 ATK}",
    description: "Comando genérico proposto para aplicar melhorias com parâmetros explícitos.",
    parameters: ["atributo", "valor", "duração"],
    status: "planejado",
  },
  {
    command: "/escudo",
    category: "utilidade",
    syntax: "/escudo [2d5]",
    description: "Cria uma proteção cuja capacidade e duração precisam ser especificadas.",
    parameters: ["capacidade", "duração"],
    status: "planejado",
  },
];

export const SKILL_COMMAND_CATEGORIES: {
  id: SkillCommandCategory;
  label: string;
}[] = [
  { id: "dano", label: "Dano" },
  { id: "debuff", label: "Efeitos negativos" },
  { id: "buff", label: "Efeitos positivos" },
  { id: "cura", label: "Cura e regeneração" },
  { id: "controle", label: "Controle" },
  { id: "utilidade", label: "Utilidade" },
];
