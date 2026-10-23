# Coffee Log ☕

Tu **diario de laboratorio personal** para café de especialidad. No es un recetario:
Coffee Log registra cada preparación y convierte tu historial en conocimiento útil
para que puedas **reproducir tus mejores tazas**.

> Estado actual (MVP): registro de preparaciones + biblioteca de cafés + ratio
> automático + dashboard ligero. El motor de análisis profundo, comparación y
> evolución de recetas son los siguientes hitos.

## Stack

- **Next.js 16** (App Router, Server Actions, Turbopack) + **React 19**
- **Supabase** — Auth (email/contraseña) y Postgres con Row Level Security
- **Tailwind CSS v4** — diseño mobile-first, cálido y moderno
- **TypeScript**, **Zod** (validación), **lucide-react**

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, pega y ejecuta el contenido de `supabase/schema.sql`.
   Esto crea las tablas `coffees`, `brews` y `grinders` con RLS (cada usuario ve solo sus datos).
3. (Recomendado para uso personal) En **Authentication → Providers → Email**,
   desactiva *"Confirm email"* para entrar sin pasar por el correo de confirmación.

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Rellena con los valores de **Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL="https://TU-PROYECTO.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-public-key"
```

### 3. Correr en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000 → te redirige a `/login`. Regístrate y empieza a registrar.

## Estructura

```
src/
  app/
    login/, signup/        Autenticación (Server Actions en app/auth/actions.ts)
    (app)/                 Área autenticada (shell con barra inferior)
      page.tsx             Dashboard: stats rápidas + historial reciente
      brews/               Registros: lista, nuevo, detalle (+ actions.ts)
      coffees/             Biblioteca: lista, nuevo, detalle (+ actions.ts)
  components/              UI (button, field, card) y formularios
  lib/
    domain.ts              Métodos de café, procesos, ratio y helpers
    supabase/              Clientes server / browser
  proxy.ts                 Refresco de sesión + gating de auth (antes "middleware")
supabase/schema.sql        Esquema + políticas RLS
```

## Agregar un nuevo método de preparación

Añade una entrada a `BREW_METHODS` en `src/lib/domain.ts`.
El resto de la app (formularios, etiquetas, iconos) lo toma de ahí.

## Moledores y molienda

En **Biblioteca → Moledores** puedes registrar un nombre y un tipo de ajuste:
**Clics** (cantidad entera desde cero) o **General** (las categorías existentes).
Al crear o editar una preparación, selecciona el moledor en la receta. También
puedes seguir registrando molienda general sin asignar uno. El detalle y la
evolución de recetas muestran el moledor y su ajuste.

Para una base de datos existente, ejecuta
`supabase/migrations/0003_add_grinders.sql` en el SQL Editor de Supabase antes
de desplegar esta versión. Las preparaciones anteriores conservan su molienda.
Para instalaciones nuevas basta con el esquema completo `supabase/schema.sql`.

Pruebas de moledores: `node --test tests/grinders.test.mjs`.

La pestaña **Biblioteca** reúne **Cafés** y **Moledores** al mismo nivel. Puedes
editar el nombre y tipo de ajuste de cada moledor, o eliminarlo cuando ya no lo
utilices. Eliminarlo lo retira de nuevas preparaciones y de la lista de equipo;
las preparaciones anteriores conservan su moledor, nombre y ajuste. Al editar
una preparación histórica, su moledor eliminado aparece solo en ese registro.

Para habilitar la edición y eliminación en una base existente, aplica también
`supabase/migrations/0004_archive_grinders.sql` después de la migración 0003.
