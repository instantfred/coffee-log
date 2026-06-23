"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { type AuthState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Un momento…" : label}
    </Button>
  );
}

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "signup";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
}) {
  const [state, formAction] = useActionState<AuthState, FormData>(action, {});
  const isLogin = mode === "login";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <div className="mb-3 text-5xl">☕</div>
        <h1 className="text-2xl font-semibold tracking-tight">Coffee Log</h1>
        <p className="mt-1 text-sm text-muted">
          Tu diario de laboratorio para café de especialidad.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <Field label="Correo" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="tu@correo.com"
            required
          />
        </Field>
        <Field label="Contraseña" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder="••••••••"
            required
          />
        </Field>

        {state.error && (
          <p className="rounded-2xl bg-bad/10 px-4 py-3 text-sm text-bad">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="rounded-2xl bg-good/10 px-4 py-3 text-sm text-good">
            {state.message}
          </p>
        )}

        <SubmitButton label={isLogin ? "Entrar" : "Crear cuenta"} />
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {isLogin ? (
          <>
            ¿Aún no tienes cuenta?{" "}
            <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
              Regístrate
            </Link>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Inicia sesión
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
