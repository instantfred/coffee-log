import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(42,33,27,0.04)]",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  tone = "muted",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "good" | "mid" | "bad" | "muted" | "accent";
}) {
  const tones: Record<string, string> = {
    good: "bg-good/12 text-good",
    mid: "bg-mid/12 text-mid",
    bad: "bg-bad/12 text-bad",
    accent: "bg-accent/12 text-accent",
    muted: "bg-surface-muted text-muted",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
