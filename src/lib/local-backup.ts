/**
 * Backup / restauração do progresso local (Zustand + comandos custom).
 * Não toca autenticação, sessão nem outras chaves.
 */

export const GAME_SAVE_KEY = "rpg-platis-v1";
export const CUSTOM_COMMANDS_KEY = "platis-custom-skill-commands";
export const SAFETY_BACKUP_KEY = "rpg-platis-v1-backup-before-restore";

export const BACKUP_FORMAT = "rpg-platis-backup" as const;
export const BACKUP_FORMAT_VERSION = 1;

export type PlatisBackupFile = {
  format: typeof BACKUP_FORMAT;
  formatVersion: number;
  exportedAt: string;
  gameSave: unknown;
  customSkillCommands: unknown | null;
};

export type BackupValidation =
  | { ok: true; data: PlatisBackupFile }
  | { ok: false; error: string };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Aceita o JSON persistido pelo Zustand (com state) ou um state raiz. */
export function isValidGameSave(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  if ("state" in value) {
    return isPlainObject(value.state);
  }
  return (
    "characters" in value ||
    "slots" in value ||
    "role" in value ||
    "version" in value
  );
}

export function validateBackupPayload(raw: unknown): BackupValidation {
  if (!isPlainObject(raw)) {
    return { ok: false, error: "Arquivo inválido: JSON deve ser um objeto." };
  }
  if (raw.format !== BACKUP_FORMAT) {
    return {
      ok: false,
      error: `Formato desconhecido (esperado "${BACKUP_FORMAT}").`,
    };
  }
  if (typeof raw.formatVersion !== "number" || raw.formatVersion < 1) {
    return { ok: false, error: "Versão do backup inválida." };
  }
  if (raw.formatVersion > BACKUP_FORMAT_VERSION) {
    return {
      ok: false,
      error: `Backup de versão mais nova (${raw.formatVersion}) que este app suporta (${BACKUP_FORMAT_VERSION}).`,
    };
  }
  if (!isValidGameSave(raw.gameSave)) {
    return {
      ok: false,
      error: "Campo gameSave ausente ou inválido (salvamento Zustand).",
    };
  }
  if (
    raw.customSkillCommands != null &&
    !Array.isArray(raw.customSkillCommands) &&
    !isPlainObject(raw.customSkillCommands)
  ) {
    return {
      ok: false,
      error: "Campo customSkillCommands inválido.",
    };
  }
  return {
    ok: true,
    data: {
      format: BACKUP_FORMAT,
      formatVersion: raw.formatVersion,
      exportedAt:
        typeof raw.exportedAt === "string"
          ? raw.exportedAt
          : new Date().toISOString(),
      gameSave: raw.gameSave,
      customSkillCommands: raw.customSkillCommands ?? null,
    },
  };
}

export function readLocalGameSave(): unknown | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(GAME_SAVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function readCustomSkillCommands(): unknown | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(CUSTOM_COMMANDS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function buildBackupObject(): PlatisBackupFile {
  const gameSave = readLocalGameSave() ?? {
    state: {},
    version: 0,
  };
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    gameSave,
    customSkillCommands: readCustomSkillCommands(),
  };
}

export function backupToJsonString(backup: PlatisBackupFile): string {
  return JSON.stringify(backup, null, 2);
}

export function downloadBackupFile(json: string, filename: string): void {
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Compartilha o arquivo no Android/Web Share API quando disponível. */
export async function shareBackupFile(
  json: string,
  filename: string,
): Promise<"shared" | "downloaded" | "unsupported"> {
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const file = new File([blob], filename, { type: "application/json" });

  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (typeof nav.share === "function") {
    try {
      const data: ShareData = { files: [file], title: "Backup RPG Platis" };
      if (typeof nav.canShare !== "function" || nav.canShare(data)) {
        await nav.share(data);
        return "shared";
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return "unsupported";
      }
    }
  }

  downloadBackupFile(json, filename);
  return "downloaded";
}

export type RestoreResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Valida e grava o backup. Preserva o save atual em SAFETY_BACKUP_KEY.
 * Não altera chaves de autenticação/sessão.
 */
export function restoreFromBackupObject(raw: unknown): RestoreResult {
  const validated = validateBackupPayload(raw);
  if (!validated.ok) return validated;

  if (typeof localStorage === "undefined") {
    return { ok: false, error: "localStorage indisponível neste ambiente." };
  }

  try {
    const current = localStorage.getItem(GAME_SAVE_KEY);
    const currentCommands = localStorage.getItem(CUSTOM_COMMANDS_KEY);
    localStorage.setItem(
      SAFETY_BACKUP_KEY,
      JSON.stringify({
        at: new Date().toISOString(),
        gameSave: current,
        customSkillCommands: currentCommands,
      }),
    );

    localStorage.setItem(
      GAME_SAVE_KEY,
      JSON.stringify(validated.data.gameSave),
    );

    if (validated.data.customSkillCommands == null) {
      localStorage.removeItem(CUSTOM_COMMANDS_KEY);
    } else {
      localStorage.setItem(
        CUSTOM_COMMANDS_KEY,
        JSON.stringify(validated.data.customSkillCommands),
      );
    }

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? `Falha ao gravar backup: ${e.message}`
          : "Falha ao gravar backup no localStorage.",
    };
  }
}

export function defaultBackupFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `platis-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
}
