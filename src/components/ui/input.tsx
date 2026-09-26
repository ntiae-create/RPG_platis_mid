import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md bg-raised px-3 text-sm text-ink placeholder:text-faint",
        "shadow-[0_0_0_1px_rgba(236,232,220,0.1)] outline-none",
        "focus-visible:shadow-[0_0_0_2px_rgba(216,208,192,0.45)]",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-md bg-raised px-3 py-2 text-sm text-ink placeholder:text-faint",
        "shadow-[0_0_0_1px_rgba(236,232,220,0.1)] outline-none",
        "focus-visible:shadow-[0_0_0_2px_rgba(216,208,192,0.45)]",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("text-xs font-medium tracking-wide text-muted", className)} {...props} />;
}
