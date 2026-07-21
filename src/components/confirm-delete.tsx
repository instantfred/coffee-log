"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

function ConfirmButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" className="w-full" disabled={pending}>
      {pending ? "Eliminando…" : label}
    </Button>
  );
}

/**
 * Destructive-action trigger that opens a confirmation dialog before running
 * the server `action`. The action receives a FormData carrying the row `id`.
 */
export function ConfirmDelete({
  action,
  id,
  triggerLabel,
  title,
  description,
  confirmLabel = "Eliminar",
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="w-full text-bad"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" /> {triggerLabel}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="w-full max-w-sm rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted">{description}</p>
            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <form action={action} className="flex-1">
                <input type="hidden" name="id" value={id} />
                <ConfirmButton label={confirmLabel} />
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
