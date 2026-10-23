import { Bean, Settings2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export default function LibraryPage() {
  return <>
    <PageHeader title="Biblioteca" subtitle="Tus cafés y equipo de preparación." />
    <div className="stagger flex flex-col gap-3">
      {[
        { href: "/coffees", label: "Cafés", description: "Tu colección de granos y sus detalles.", icon: Bean },
        { href: "/grinders", label: "Moledores", description: "Administra tus moledores y su tipo de ajuste.", icon: Settings2 },
      ].map(({ href, label, description, icon: Icon }) => <Link key={href} href={href} className="interactive-card flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 hover:bg-surface-muted">
        <Icon className="h-6 w-6 text-primary" />
        <div className="flex-1"><div className="font-medium">{label}</div><p className="mt-1 text-sm text-muted">{description}</p></div>
        <ChevronRight className="h-5 w-5 text-muted" />
      </Link>)}
    </div>
  </>;
}
