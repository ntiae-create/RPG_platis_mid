import {
  emptyWendigoMeta,
  resolveWendigoSkill,
  wendigoAbsorbShield,
  wendigoOnTurnAdvance,
  wendigoEstCostMultiplier,
  wendigoBlocksHeal,
  type WendigoMeta,
  emptyTsuchigumoMeta,
  resolveTsuchigumoSkill,
  tsuchiOnTurnAdvance,
  type TsuchigumoMeta,
  emptyCamazotzMeta,
  resolveCamazotzSkill,
  camazotzOnTurnAdvance,
  camazotzPlayerHealMult,
  type CamazotzMeta,
  emptyAmmitMeta,
  resolveAmmitSkill,
  ammitOnTurnAdvance,
  ammitRegisterHitTaken,
  ammitIncomingDamageMult,
  addWeight as ammitAddWeight,
  type AmmitMeta,
  emptyFenrirMeta,
  resolveFenrirSkill,
  fenrirOnTurnAdvance,
  fenrirWeakenGleipnir,
  fenrirAddFury,
  type FenrirMeta,
} from "@/data/world-boss-kits";

// TEMPORARY STUB — restore full file from Termux (see instructions)
// Full store was corrupted; use: git show 73ebb90:src/lib/store.ts > src/lib/store.ts
export const usePlatis = new Proxy({} as any, {
  get() {
    throw new Error(
      "store.ts incomplete. Restore: git show 73ebb90:src/lib/store.ts > src/lib/store.ts && git add src/lib/store.ts && git commit -m 'restore store' && git push",
    );
  },
});
