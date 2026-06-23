import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState({
  emoji,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  emoji: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center">
      <div className="mb-3 text-4xl">{emoji}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>
      {actionLabel && actionHref && (
        <Button asChild className="mt-5">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
