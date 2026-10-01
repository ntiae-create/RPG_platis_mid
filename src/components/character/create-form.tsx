import { useMemo, useState } from "react";
import { AFFINITIES } from "@/data/affinities";
import { CLASSES } from "@/data/classes";
import { RACES, TIER_LABEL } from "@/data/races";
import type { AffinityId, Gender } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { AffinityIcon } from "./affinity-icon";
import {
  createCharacter,
  finalStats,
  getCharacterImage,
} from "@/lib/stats";
import { STAT_LABELS } from "@/data/progression";
import { cn } from "@/lib/utils";
import { Lock, Mars, Venus } from "lucide-react";

export function CreateForm({
  isMaster,
  onCreated,
}: {
  isMaster: boolean;
  onCreated: (ch: ReturnType<typeof createCharacter>) => void;
}) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("masculino");
  const [raceId, setRaceId] = useState("humano");
  const [classId, setClassId] = useState("guerreiro");
  const [affinityId, setAffinityId] =
    useState<AffinityId>("fogo");
  const [image, setImage] = useState<string | undefined>();
  const [filter, setFilter] = useState("");

  const race = RACES.find((r) => r.id === raceId)!;
  const cls = CLASSES.find((c) => c.id === classId)!;

  /*
   * ============================================================
   * IMAGEM ATUAL DO PERSONAGEM
   *
   * Se houver imagem personalizada, ela tem prioridade.
   * Caso contrário:
   *
   * raça + gênero
   *        ↓
   * imagem correspondente
   *        ↓
   * fallback para portrait da raça
   * ============================================================
   */

  const characterImage = useMemo(
    () =>
      getCharacterImage(
        raceId,
        gender,
        image,
      ),
    [raceId, gender, image],
  );

  /*
   * ============================================================
   * PREVIEW DOS STATUS
   * ============================================================
   */

  const preview = useMemo(
    () =>
      finalStats(
        createCharacter({
          name: "x",
          gender,
          raceId,
          classId,
          affinityId,
        }),
      ),
    [gender, raceId, classId, affinityId],
  );

  const classes = CLASSES.filter((c) =>
    c.name
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );

  /*
   * ============================================================
   * UPLOAD DE IMAGEM PERSONALIZADA
   * ============================================================
   */

  function onFile(file: File | undefined) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const canvas =
          document.createElement("canvas");

        const size = 512;

        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        const scale = Math.max(
          size / img.width,
          size / img.height,
        );

        const w = img.width * scale;
        const h = img.height * scale;

        ctx.drawImage(
          img,
          (size - w) / 2,
          (size - h) / 2,
          w,
          h,
        );

        setImage(
          canvas.toDataURL(
            "image/jpeg",
            0.82,
          ),
        );
      };

      img.src = String(reader.result);
    };

    reader.readAsDataURL(file);
  }

  /*
   * ============================================================
   * FORMULÁRIO
   * ============================================================
   */

  return (
    <form
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]"
      onSubmit={(e) => {
        e.preventDefault();

        onCreated(
          createCharacter({
            name,
            gender,
            raceId,
            classId,
            affinityId,

            /*
             * IMPORTANTE:
             *
             * Não usamos race.portrait aqui.
             *
             * Se image estiver vazia, createCharacter()
             * escolherá automaticamente a imagem através
             * de raça + gênero.
             */
            image,

            isMaster,
          }),
        );
      }}
    >
      <div className="space-y-6">

        {/* =====================================================
            NOME
            ===================================================== */}

        <div className="space-y-2">
          <Label htmlFor="nome">
            Nome
          </Label>

          <Input
            id="nome"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="Nome do personagem"
            required
            maxLength={32}
          />
        </div>

        {/* =====================================================
            GÊNERO
            ===================================================== */}

        <div>
          <Label>
            Gênero
          </Label>

          <div className="mt-2 grid grid-cols-2 gap-2">

            <button
              type="button"
              onClick={() =>
                setGender("masculino")
              }
              className={cn(
                "flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 py-2",
                "shadow-[0_0_0_1px_rgba(236,232,220,0.1)]",
                gender === "masculino" &&
                  "bg-raised shadow-[0_0_0_2px_#d8d0c0]",
              )}
            >
              <Mars className="size-4" />

              <span className="text-sm font-medium">
                Masculino
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setGender("feminino")
              }
              className={cn(
                "flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 py-2",
                "shadow-[0_0_0_1px_rgba(236,232,220,0.1)]",
                gender === "feminino" &&
                  "bg-raised shadow-[0_0_0_2px_#d8d0c0]",
              )}
            >
              <Venus className="size-4" />

              <span className="text-sm font-medium">
                Feminino
              </span>
            </button>

          </div>

          <p className="mt-2 text-xs text-muted">
            O gênero será usado para definir a
            arte correspondente à raça do
            personagem.
          </p>
        </div>

        {/* =====================================================
            IMAGEM PERSONALIZADA
            ===================================================== */}

        <div className="space-y-2">
          <Label>
            Imagem personalizada
          </Label>

          <div className="flex flex-wrap gap-2">

            <label className="inline-flex h-11 items-center rounded-md bg-raised px-3 text-sm shadow-[0_0_0_1px_rgba(236,232,220,0.1)]">
              Enviar do dispositivo

              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) =>
                  onFile(
                    e.target.files?.[0],
                  )
                }
              />
            </label>

            <Input
              placeholder="URL da imagem"
              onBlur={(e) => {
                if (
                  e.target.value.startsWith(
                    "http",
                  )
                ) {
                  setImage(e.target.value);
                }
              }}
            />

          </div>

          <p className="text-xs text-muted">
            Se nenhuma imagem for enviada,
            será usada automaticamente a
            imagem da raça correspondente
            ao gênero escolhido.
          </p>
        </div>

        {/* =====================================================
            RAÇA
            ===================================================== */}

        <div>
          <Label>
            Raça — apenas Basic no início
          </Label>

          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">

            {RACES.map((r) => {
              const locked =
                r.unlock !== "start" &&
                !(
                  isMaster &&
                  r.unlock === "master"
                );

              const masterOnly =
                r.unlock === "master" &&
                isMaster;

              const can =
                !locked || masterOnly;

              /*
               * A miniatura também acompanha
               * o gênero selecionado.
               */
              const racePreviewImage =
                getCharacterImage(
                  r.id,
                  gender,
                );

              return (
                <button
                  key={r.id}
                  type="button"
                  disabled={!can}
                  onClick={() =>
                    can && setRaceId(r.id)
                  }
                  className={cn(
                    "relative overflow-hidden rounded-lg text-left",
                    "shadow-[0_0_0_1px_rgba(236,232,220,0.1)]",
                    raceId === r.id &&
                      "shadow-[0_0_0_2px_#d8d0c0]",
                    !can &&
                      "opacity-40",
                    r.id === "kitsune" &&
                      "race-selection-kitsune",
                    r.id === "doppelganger" &&
                      "race-selection-doppelganger",
                  )}
                >
                  <img
                    src={racePreviewImage}
                    alt=""
                    className="h-24 w-full object-cover"
                  />

                  <div className="px-2 py-1.5">

                    <div className="flex items-center justify-between gap-1">

                      <span className="text-sm font-medium">
                        {r.name}
                      </span>

                      {!can && (
                        <Lock className="size-3.5 text-faint" />
                      )}

                    </div>

                    <div className="text-[10px] text-muted">
                      {TIER_LABEL[r.tier]} ·{" "}
                      {r.passive.name}
                    </div>

                  </div>
                </button>
              );
            })}

          </div>

          <p className="mt-2 text-xs text-muted">
            {race.passive.description}
          </p>
        </div>

        {/* =====================================================
            CLASSE
            ===================================================== */}

        <div>

          <div className="flex items-end justify-between gap-3">

            <Label>
              Classe — 43 oficiais
            </Label>

            <Input
              className="max-w-48"
              placeholder="Filtrar"
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value)
              }
            />

          </div>

          <div className="mt-2 grid max-h-64 grid-cols-1 gap-1 overflow-auto sm:grid-cols-2">

            {classes.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  setClassId(c.id)
                }
                className={cn(
                  "rounded-md px-3 py-2 text-left text-sm",
                  "shadow-[0_0_0_1px_rgba(236,232,220,0.08)]",
                  classId === c.id &&
                    "bg-raised shadow-[0_0_0_2px_#d8d0c0]",
                )}
              >

                <div className="font-medium">
                  {c.name}
                </div>

                <div className="text-[11px] text-muted">
                  {c.passive.name}
                </div>

              </button>
            ))}

          </div>

          <p className="mt-2 text-xs text-muted">
            {cls.passive.description}
          </p>

        </div>

        {/* =====================================================
            AFINIDADE
            ===================================================== */}

        <div>

          <Label>
            Afinidade — altera a cor e o efeito
            do card
          </Label>

          <div className="mt-2 grid grid-cols-4 gap-2">

            {AFFINITIES.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() =>
                  setAffinityId(a.id)
                }
                className={cn(
                  "flex min-h-11 flex-col items-center gap-1 rounded-md py-2",
                  "shadow-[0_0_0_1px_rgba(236,232,220,0.1)]",
                  affinityId === a.id &&
                    "bg-raised shadow-[0_0_0_2px_#d8d0c0]",
                )}
              >

                <AffinityIcon
                  id={a.id}
                  className="size-4"
                />

                <span className="text-[11px]">
                  {a.name}
                </span>

              </button>
            ))}

          </div>

        </div>

        {/* =====================================================
            CONFIRMAR
            ===================================================== */}

        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto"
        >
          Entrar na mesa · Nível 1, Sem Brasão, 3 slots
        </Button>

      </div>

      {/* =======================================================
          PREVIEW
          ======================================================= */}

      <aside className="panel h-fit p-4">

        <p className="text-[10px] tracking-wide text-muted uppercase">
          Personagem
        </p>

        <p className="mt-1 text-xs text-muted">
          {name || "Novo personagem"}
        </p>

        <div className="mt-2 text-xs text-muted">
          {gender === "masculino"
            ? "Masculino"
            : "Feminino"}{" "}
          · {race.name} · {cls.name}
        </div>

        {/* STATUS */}

        <p className="mt-4 text-[10px] tracking-wide text-muted uppercase">
          Status final
        </p>

        <p className="mt-1 text-xs text-muted">
          Base racial + bônus da classe
        </p>

        <ul className="mt-3 space-y-1.5">

          {(
            Object.keys(STAT_LABELS) as (
              keyof typeof STAT_LABELS
            )[]
          ).map((k) => (
            <li
              key={k}
              className="flex justify-between text-sm"
            >
              <span className="text-muted">
                {STAT_LABELS[k]}
              </span>

              <span className="tabular font-medium">
                {preview[k]}
              </span>
            </li>
          ))}

        </ul>

        {/* =====================================================
            IMAGEM DO PERSONAGEM
            ===================================================== */}

        <img
          src={characterImage}
          alt={
            name ||
            `${race.name} ${gender}`
          }
          className="mt-4 aspect-[3/4] w-full rounded-lg object-cover"
        />

      </aside>

    </form>
  );
}
