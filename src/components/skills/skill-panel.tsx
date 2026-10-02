import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { AreaDir, Skill, SkillAffinity, SkillType, TargetMode } from "@/data/types";
import { skillSlots } from "@/lib/stats";
import { usePlatis } from "@/lib/store";

const TYPES: SkillType[] = ["buff", "debuff", "heal", "ataque", "ataque-magico"];
const DIRS: AreaDir[] = ["cima", "baixo", "lados", "diagonal", "personalizado"];

export function SkillPanel() {
  const selfId = usePlatis((s) => s.selfId);
  const ch = usePlatis((s) => (s.selfId ? s.characters[s.selfId] : null));
  const submit = usePlatis((s) => s.submitSkill);
  const role = usePlatis((s) => s.role);
  const characters = usePlatis((s) => s.characters);
  const masterSkill = usePlatis((s) => s.masterSkill);
  const setPassive = usePlatis((s) => s.setPersonalPassive);
  const [slot, setSlot] = useState(0);
  const [pName, setPName] = useState(ch?.personalPassive.name === "—" ? "" : ch?.personalPassive.name ?? "");
  const [pDesc, setPDesc] = useState(
    ch?.personalPassive.description === "Ainda não definida." ? "" : ch?.personalPassive.description ?? "",
  );

  if (!ch) return null;
  const max = skillSlots(ch.brasaoXp);
  const current = ch.skills[slot];

  const pending = Object.values(characters).flatMap((c) =>
    c.skills
      .filter((sk) => sk.status === "pending" && sk.name)
      .map((sk) => ({ c, sk })),
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form
        className={`panel skill-affinity-card skill-affinity-${ch.affinityId} skill-level-${slot + 1} space-y-3 p-4`}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
            const skillData = {
              name: String(fd.get("name")),
              description: String(fd.get("description")),
              type: String(fd.get("type")) as SkillType,
              affinity: String(fd.get("affinity") || "fisico") as SkillAffinity,
              cost: {
                hp: Number(fd.get("hp")) || 0,
                mp: Number(fd.get("mp")) || 0,
                est: Number(fd.get("est")) || 0,
              },
              target: String(fd.get("target")) as TargetMode,
              areaCount: Number(fd.get("areaCount")) || 1,
              areaSquares: Number(fd.get("areaSquares")) || 1,
              direction: String(fd.get("direction")) as AreaDir,
              range: Number(fd.get("range")) || 1,
              duration: Number(fd.get("duration")) || 0,
              cooldown: Number(fd.get("cooldown")) || 0,
            };
            submit(slot, skillData);
            const submittedSkill = usePlatis.getState().characters[ch.id]?.skills[slot];
            if (submittedSkill) {
              window.dispatchEvent(
                new CustomEvent("platis-skill-submitted", {
                  detail: {
                    type: "skill-submitted",
                    characterId: ch.id,
                    skill: submittedSkill,
                  },
                }),
              );
            }
        }}
      >
        <h2 className="font-display text-2xl">Criar habilidade</h2>
        <p className="text-xs text-muted">
          Fluxo: rascunho → pendente → o Mestre aprova, edita ou recusa. Editar uma aprovada volta para pendente.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: max }).map((_, i) => (
            <Button
              key={i}
              type="button"
              size="sm"
              variant={slot === i ? "default" : "secondary"}
              onClick={() => setSlot(i)}
            >
              Slot {i + 1}
              {i === 3 ? " · Brasão Grande" : ""}
            </Button>
          ))}
        </div>
        <div className="grid gap-2">
          <Label>Nome</Label>
          <Input name="name" defaultValue={current?.name} required />
          <Label>Descrição</Label>
          <Textarea name="description" defaultValue={current?.description} required />
          <Label>Tipo</Label>
          <select name="type" defaultValue={current?.type} className="h-11 rounded-md bg-raised px-3 text-sm">
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Label>Afinidade</Label>
          <select
            name="affinity"
            value={ch.affinityId}
            disabled
            className="h-11 rounded-md bg-raised px-3 text-sm opacity-80"
          >
            <option value={ch.affinityId}>{ch.affinityId}</option>
          </select>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>HP</Label>
              <Input name="hp" type="number" min={0} defaultValue={current?.cost.hp ?? 0} />
            </div>
            <div>
              <Label>MP</Label>
              <Input name="mp" type="number" min={0} defaultValue={current?.cost.mp ?? 4} />
            </div>
            <div>
              <Label>EST</Label>
              <Input name="est" type="number" min={0} defaultValue={current?.cost.est ?? 0} />
            </div>
          </div>
          <Label>Alvo</Label>
          <select name="target" defaultValue={current?.target} className="h-11 rounded-md bg-raised px-3 text-sm">
            <option value="unico">Único</option>
            <option value="area">Área</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Inimigos na área</Label>
              <Input name="areaCount" type="number" min={1} defaultValue={current?.areaCount ?? 1} />
            </div>
            <div>
              <Label>Quadrados</Label>
              <Input name="areaSquares" type="number" min={1} defaultValue={current?.areaSquares ?? 1} />
            </div>
          </div>
          <Label>Direção</Label>
          <select name="direction" defaultValue={current?.direction} className="h-11 rounded-md bg-raised px-3 text-sm">
            {DIRS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Alcance</Label>
              <Input name="range" type="number" min={0} defaultValue={current?.range ?? 1} />
            </div>
            <div>
              <Label>Duração</Label>
              <Input name="duration" type="number" min={0} defaultValue={current?.duration ?? 0} />
            </div>
            <div>
              <Label>Cooldown</Label>
              <Input name="cooldown" type="number" min={0} defaultValue={current?.cooldown ?? 0} />
            </div>
          </div>
        </div>
        <Button type="submit">Enviar para aprovação</Button>
      </form>

      <div className="space-y-4">
        <div className={`panel passive-affinity-card aff-${ch.affinityId} space-y-2 p-4`}>
          <h3 className="font-display text-xl">Passiva do personagem</h3>
          <Input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Nome" />
          <Textarea value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="Descrição" />
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPassive(pName || "—", pDesc || "Ainda não definida.")}
          >
            Salvar passiva
          </Button>
        </div>

        {role === "mestre" && (
          <div className="panel space-y-3 p-4">
            <h3 className="font-display text-xl">Fila de aprovação</h3>
            {pending.length === 0 && <p className="text-sm text-muted">Nada pendente.</p>}
            {pending.map(({ c, sk }) => (
              <div key={sk.id} className="rounded-md bg-raised p-3">
                <p className="text-sm font-medium">
                  {c.name} · {sk.name}
                </p>
                <p className="text-xs text-muted">{sk.description}</p>
                <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => window.dispatchEvent(new CustomEvent("platis-skill-decision", { detail: { type: "skill-decision", characterId: c.id, skillId: sk.id, action: "approve" } }))}>
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                      onClick={() => window.dispatchEvent(new CustomEvent("platis-skill-decision", { detail: { type: "skill-decision", characterId: c.id, skillId: sk.id, action: "reject", edit: { masterNote: "Recusada" } } }))}
                  >
                    Recusar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {selfId && role !== "mestre" && (
          <p className="text-xs text-muted">O Mestre vê esta fila na aba Mesa.</p>
        )}
      </div>
    </div>
  );
}
