import type { Skill } from "@/data/types";

export type SkillP2PMessage =
  | {
      type: "skill-submitted";
      characterId: string;
      skill: Skill;
    }
  | {
      type: "skill-decision";
      characterId: string;
      skillId: string;
      action: "approve" | "reject" | "edit";
      edit?: Partial<Skill>;
    };
