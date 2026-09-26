import { useMemo, useState } from "react";
import { AFFINITIES } from "@/data/affinities";
import { CLASSES } from "@/data/classes";
import { RACES, TIER_LABEL } from "@/data/races";
import type { AffinityId } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { AffinityIcon } from "./affinity-icon";
import { createCharacter, finalStats } from "@/lib/stats";
import { STAT_LABELS } from "@/data/progression";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

export function CreateForm({
  isMaster,
  onCreated,
}: {
  isMaster: boolean;
  onCreated: (ch: ReturnType<typeof createCharacter>) => void;
}) {
  const [name, setName] = useState("");
  const [raceId, setRaceId] = useState("humano");
  const [classId, setClassId] = useState("guerreiro");
  const [affinityId, setAffinityId] = useState<AffinityId>("fogo");
  const [image, setImage] = useState<string | undefined>();
  const [filter, setFilter] = useState("");

  const race = RACES.find((r) => r.id === raceId)!;
  const cls = CLASSES.find((c) => c.id === classId)!;
  const preview = useMemo(
    () =>
      finalStats(
        createCharacter({ name: "x", raceId, classId, affinityId }),
      ),
    [raceId, classId, affinityId],
  );

  const classes = CLASSES.filter((c) =>
    c.name.toLowerCase().includes(filter.toLowerCase()),
  );

  function onFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        setImage(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <form
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]"
      onSubmit={(e) => {
        e.preventDefault();
        onCreated(
          createCharacter({
            name,
            raceId,
            classId,
            affinityId,
            image: image || race.portrait,
            isMaster,
          }),
        );
      }}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input
            id="nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do personagem"
            required
            maxLength={32}
          />
        </div>

        <div className="space-y-2">
          <Label>Imagem</Label>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-11 items-center rounded-md bg-raised px-3 text-sm shadow-[0_0_0_1px_rgba(236,232,220,0.1)]">
              Enviar do dispositivo
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </label>
            <Input
              placeholder="URL da imagem"
              onBlur={(e) => {
                if (e.target.value.startsWith("http")) setImage(e.target.value);
              }}
            />
          </div>
        </div>

        <div>
          <Label>Raça — apenas Basic no início</Label>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {RACES.map((r) => {
              const locked = r.unlock !== "start" && !(isMaster && r.unlock === "master");
              const masterOnly = r.unlock === "master" && isMaster;
              const can = !locked || masterOnly;
              return (
                <button
                  key={r.id}
                  type="button"
                  disabled={!can}
                  onClick={() => can && setRaceId(r.id)}
                  className={cn(
                    "relative overflow-hidden rounded-lg text-left",
                    "shadow-[0_0_0_1px_rgba(236,232,220,0.1)]",
                    raceId === r.id && "shadow-[0_0_0_2px_#d8d0c0]",
                    !can && "opacity-40",
                  )}
                >
                  <img src={r.portrait} alt="" className="h-24 w-full object-cover" />
                  <div className="px-2 py-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-medium">{r.name}</span>
                      {!can && <Lock className="size-3.5 text-faint" />}
                    </div>
                    <div className="text-[10px] text-muted">
                      {TIER_LABEL[r.tier]} · {r.passive.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted">{race.passive.description}</p>
        </div>

        <div>
          <div className="flex items-end justify-between gap-3">
            <Label>Classe — 43 oficiais</Label>
            <Input
              className="max-w-48"
              placeholder="Filtrar"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="mt-2 grid max-h-64 grid-cols-1 gap-1 overflow-auto sm:grid-cols-2">
            {classes.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setClassId(c.id)}
                className={cn(
                  "rounded-md px-3 py-2 text-left text-sm",
                  "shadow-[0_0_0_1px_rgba(236,232,220,0.08)]",
                  classId === c.id && "bg-raised shadow-[0_0_0_2px_#d8d0c0]",
                )}
              >
                <div className="font-medium">{c.name}</div>
                <div className="text-[11px] text-muted">{c.passive.name}</div>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">{cls.passive.description}</p>
        </div>

        <div>
          <Label>Afinidade — altera a cor e o efeito do card</Label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {AFFINITIES.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAffinityId(a.id)}
                className={cn(
                  "flex min-h-11 flex-col items-center gap-1 rounded-md py-2",
                  "shadow-[0_0_0_1px_rgba(236,232,220,0.1)]",
                  affinityId === a.id && "bg-raised shadow-[0_0_0_2px_#d8d0c0]",
                )}
              >
                <AffinityIcon id={a.id} className="size-4" />
                <span className="text-[11px]">{a.name}</span>
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full sm:w-auto">
          Entrar na mesa · Nível 1, Sem Brasão, 3 slots
        </Button>
      </div>

      <aside className="panel h-fit p-4">
        <p className="text-[10px] tracking-wide text-muted uppercase">Status final</p>
        <p className="mt-1 text-xs text-muted">Base racial + bônus da classe</p>
        <ul className="mt-3 space-y-1.5">
          {(Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[]).map((k) => (
            <li key={k} className="flex justify-between text-sm">
              <span className="text-muted">{STAT_LABELS[k]}</span>
              <span className="tabular font-medium">{preview[k]}</span>
            </li>
          ))}
        </ul>
        <img
          src={image || race.portrait}
          alt=""
          className="mt-4 aspect-[3/4] w-full rounded-lg object-cover"
        />
      </aside>
    </form>
  );
}
