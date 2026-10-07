import {
  STATUS_EFFECTS,
  AFFINITY_REACTIONS,
  type StatusEffectInstance,
} from "@/data/types";

export function createStatusEffect(
  effectId: string,
  targetId: string,
  options?: {
    sourceId?: string;
    stacks?: number;
    duration?: number | null;
  },
): StatusEffectInstance {
  const definition = STATUS_EFFECTS[effectId];

  if (!definition) {
    throw new Error(`Efeito não definido: ${effectId}`);
  }

  return {
    id: definition.id,
    targetId,
    sourceId: options?.sourceId,
    stacks: options?.stacks ?? 1,
    duration:
      options?.duration !== undefined
        ? options.duration
        : null,
  };
}

export function hasStatusEffect(
  effects: StatusEffectInstance[],
  effectId: string,
  targetId: string,
): boolean {
  return effects.some(
    (effect) =>
      effect.id === effectId &&
      effect.targetId === targetId &&
      effect.stacks > 0,
  );
}

export function getStatusEffect(
  effects: StatusEffectInstance[],
  effectId: string,
  targetId: string,
): StatusEffectInstance | undefined {
  return effects.find(
    (effect) =>
      effect.id === effectId &&
      effect.targetId === targetId &&
      effect.stacks > 0,
  );
}

export function addStatusEffect(
  effects: StatusEffectInstance[],
  effectId: string,
  targetId: string,
  options?: {
    sourceId?: string;
    stacks?: number;
    duration?: number | null;
  },
): StatusEffectInstance[] {
  const incoming = createStatusEffect(
    effectId,
    targetId,
    options,
  );

  const definition = STATUS_EFFECTS[effectId];

  if (!definition) {
    throw new Error(`Efeito não definido: ${effectId}`);
  }

  const existing = getStatusEffect(
    effects,
    effectId,
    targetId,
  );

  const maxStacks = definition.maxStacks;

  if (!existing) {
    return [
      ...effects,
      {
        ...incoming,
        stacks:
          maxStacks !== undefined
            ? Math.min(incoming.stacks, maxStacks)
            : incoming.stacks,
      },
    ];
  }

  const nextStacks =
    maxStacks !== undefined
      ? Math.min(
          maxStacks,
          existing.stacks + incoming.stacks,
        )
      : existing.stacks + incoming.stacks;

  return effects.map((effect) =>
    effect === existing
      ? {
          ...effect,
          stacks: nextStacks,
          duration:
            incoming.duration ?? effect.duration,
          sourceId:
            incoming.sourceId ?? effect.sourceId,
        }
      : effect,
  );
}

export function removeStatusEffect(
  effects: StatusEffectInstance[],
  effectId: string,
  targetId: string,
  stacks = 1,
): StatusEffectInstance[] {
  return effects
    .map((effect) => {
      if (
        effect.id !== effectId ||
        effect.targetId !== targetId
      ) {
        return effect;
      }

      return {
        ...effect,
        stacks: Math.max(0, effect.stacks - stacks),
      };
    })
    .filter(
      (effect) =>
        effect.stacks > 0 ||
        effect.id !== effectId ||
        effect.targetId !== targetId,
    );
}

export function addColdEffect(
  effects: StatusEffectInstance[],
  targetId: string,
  sourceId?: string,
): StatusEffectInstance[] {
  const current = getStatusEffect(
    effects,
    "cold",
    targetId,
  );

  const nextStacks = Math.min(
    3,
    (current?.stacks ?? 0) + 1,
  );

  let next = addStatusEffect(
    effects,
    "cold",
    targetId,
    {
      sourceId,
      stacks: 1,
      duration: 2,
    },
  );

  next = next.map((effect) =>
    effect.id === "cold" &&
    effect.targetId === targetId
      ? {
          ...effect,
          stacks: nextStacks,
          duration: 2,
        }
      : effect,
  );

  if (nextStacks >= 3) {
    next = removeStatusEffect(
      next,
      "cold",
      targetId,
      3,
    );

    next = addStatusEffect(
      next,
      "freeze",
      targetId,
      {
        sourceId,
        stacks: 1,
        duration: 1,
      },
    );
  }

  return next;
}

export function tickStatusEffects(
  effects: StatusEffectInstance[],
): StatusEffectInstance[] {
  return effects
    .map((effect) => ({
      ...effect,
      duration:
        effect.duration === null
          ? null
          : Math.max(0, effect.duration - 1),
    }))
    .filter(
      (effect) =>
        effect.duration === null || effect.duration > 0,
    );
}

export type AffinityReactionResult = {
  reactionId: string;
  effectId: string;
  activated: boolean;
  blockTurns: number;
};

export function resolveAffinityReaction(
  firstAffinity: string,
  secondAffinity: string,
  roll = Math.random(),
): AffinityReactionResult | null {
  const reaction = AFFINITY_REACTIONS.find(
    (entry) =>
      (entry.firstAffinity === firstAffinity &&
        entry.secondAffinity === secondAffinity) ||
      (entry.firstAffinity === secondAffinity &&
        entry.secondAffinity === firstAffinity),
  );

  if (!reaction) return null;

  const activated = roll < reaction.chance;

  return {
    reactionId: reaction.id,
    effectId: reaction.resultEffectId,
    activated,
    blockTurns: activated
      ? 0
      : reaction.reactionBlockTurns,
  };
}

export type AffinityReactionBlock = {
  reactionId: string;
  remainingTurns: number;
};

export function tickAffinityReactionBlocks(
  blocks: AffinityReactionBlock[],
): AffinityReactionBlock[] {
  return blocks
    .map((block) => ({
      ...block,
      remainingTurns: Math.max(
        0,
        block.remainingTurns - 1,
      ),
    }))
    .filter((block) => block.remainingTurns > 0);
}

export function isAffinityReactionBlocked(
  blocks: AffinityReactionBlock[],
  reactionId: string,
): boolean {
  return blocks.some(
    (block) =>
      block.reactionId === reactionId &&
      block.remainingTurns > 0,
  );
}

export function blockAffinityReaction(
  blocks: AffinityReactionBlock[],
  reactionId: string,
  turns = 3,
): AffinityReactionBlock[] {
  const existing = blocks.find(
    (block) => block.reactionId === reactionId,
  );

  if (existing) {
    return blocks.map((block) =>
      block === existing
        ? {
            ...block,
            remainingTurns: Math.max(
              block.remainingTurns,
              turns,
            ),
          }
        : block,
    );
  }

  return [
    ...blocks,
    {
      reactionId,
      remainingTurns: turns,
    },
  ];
}
