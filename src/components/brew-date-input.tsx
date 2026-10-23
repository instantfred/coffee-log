"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/field";

const pad = (n: number) => n.toString().padStart(2, "0");

export function BrewDateInput({ brewedAt }: { brewedAt?: string }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = ref.current;
    if (brewedAt || !input || input.value) return;
    // The browser owns the local clock. Keep SSR and initial hydration empty,
    // then set the default once without overwriting anything the user entered.
    const now = new Date();
    input.defaultValue = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }, [brewedAt]);

  // Stored dates are wall-clock timestamps: read UTC parts verbatim in every timezone.
  const date = brewedAt ? new Date(brewedAt) : null;
  const initial = date
    ? `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
    : "";

  return <Input ref={ref} id="brewed_at" name="brewed_at" type="datetime-local" defaultValue={initial} />;
}
