import { Coffee, FlaskConical, Funnel, GlassWater, Snowflake, Cylinder } from "lucide-react";
import { cn } from "@/lib/utils";

export function MethodIcon({ method, className }: { method: string; className?: string }) {
  const Icon = ["v60", "chemex", "kalita", "origami", "clever"].includes(method) ? Funnel
    : method === "cold_brew" ? Snowflake
    : ["french_press", "aeropress"].includes(method) ? Cylinder
    : method === "siphon" ? FlaskConical
    : method === "turkish" ? GlassWater : Coffee;
  return <Icon aria-hidden="true" className={cn("h-6 w-6", className)} strokeWidth={1.6} />;
}
