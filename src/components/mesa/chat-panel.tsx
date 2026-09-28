import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlatis } from "@/lib/store";

export function ChatPanel({ onSend }: { onSend?: (text: string) => void }) {
  const chat = usePlatis((s) => s.chat);
  const send = usePlatis((s) => s.sendChat);
  const [text, setText] = useState("");
  return (
    <div className="panel flex h-[320px] flex-col overflow-hidden">
      <div className="px-3 py-2 text-[10px] tracking-wide text-muted uppercase">Chat da mesa</div>
      <div className="min-h-0 flex-1 space-y-2 overflow-auto px-3">
        {chat.length === 0 && <p className="text-xs text-muted">Nenhuma mensagem ainda.</p>}
        {chat.map((m) => (
          <div key={m.id}>
            <div className="text-[11px] text-muted">{m.from}</div>
            <p className="text-sm">{m.text}</p>
          </div>
        ))}
      </div>
      <form
        className="flex gap-2 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
          onSend?.(text);
          setText("");
        }}
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Falar na mesa" />
        <Button type="submit" size="sm">
          Enviar
        </Button>
      </form>
    </div>
  );
}
