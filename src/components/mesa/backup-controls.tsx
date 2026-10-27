import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  buildBackupObject,
  backupToJsonString,
  defaultBackupFilename,
  restoreFromBackupObject,
  shareBackupFile,
  validateBackupPayload,
} from "@/lib/local-backup";

type Props = {
  /** compact = linha única para header; panel = bloco com título */
  variant?: "compact" | "panel";
  className?: string;
};

export function BackupControls({ variant = "panel", className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onExport() {
    setMessage(null);
    setBusy(true);
    try {
      const backup = buildBackupObject();
      const json = backupToJsonString(backup);
      const name = defaultBackupFilename();
      const result = await shareBackupFile(json, name);
      if (result === "shared") {
        setMessage("Backup compartilhado.");
      } else if (result === "downloaded") {
        setMessage("Backup baixado: " + name);
      } else {
        setMessage(
          "Compartilhamento cancelado. Use Exportar de novo se precisar do arquivo.",
        );
      }
    } catch (e) {
      setMessage(
        e instanceof Error ? `Erro ao exportar: ${e.message}` : "Erro ao exportar.",
      );
    } finally {
      setBusy(false);
    }
  }

  function onPickImport() {
    setMessage(null);
    inputRef.current?.click();
  }

  async function onFileSelected(file: File | null) {
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        setMessage("Arquivo inválido: não é um JSON legível.");
        return;
      }

      const check = validateBackupPayload(parsed);
      if (!check.ok) {
        setMessage(check.error);
        return;
      }

      const ok = window.confirm(
        "Restaurar este backup?\n\n" +
          "Isso substitui o progresso local da mesa (personagens, combate, loja, etc.).\n" +
          "O salvamento atual será guardado como segurança no aparelho.\n" +
          "A página será recarregada após a restauração.",
      );
      if (!ok) {
        setMessage("Importação cancelada.");
        return;
      }

      const result = restoreFromBackupObject(parsed);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }

      setMessage("Backup restaurado. Recarregando…");
      window.location.reload();
    } catch (e) {
      setMessage(
        e instanceof Error ? `Erro ao importar: ${e.message}` : "Erro ao importar.",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const body = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
      />
      <div
        className={
          variant === "compact"
            ? "flex flex-wrap gap-2"
            : "flex flex-col gap-2 sm:flex-row"
        }
      >
        <Button
          type="button"
          size={variant === "compact" ? "sm" : "default"}
          variant="secondary"
          disabled={busy}
          onClick={() => void onExport()}
        >
          Exportar backup
        </Button>
        <Button
          type="button"
          size={variant === "compact" ? "sm" : "default"}
          variant="outline"
          disabled={busy}
          onClick={onPickImport}
        >
          Importar backup
        </Button>
      </div>
      {message && (
        <p className="mt-2 text-xs text-muted" role="status">
          {message}
        </p>
      )}
    </>
  );

  if (variant === "compact") {
    return <div className={className}>{body}</div>;
  }

  return (
    <div
      className={
        "rounded-md border border-line bg-raised/40 p-4 " + (className ?? "")
      }
    >
      <p className="font-medium">Backup local</p>
      <p className="mt-1 text-xs text-muted">
        Exporta o salvamento da mesa (localStorage) e os comandos de skill
        personalizados. Não altera login nem sessão. No Android, pode
        compartilhar o arquivo se o sistema permitir.
      </p>
      <div className="mt-3">{body}</div>
    </div>
  );
}
