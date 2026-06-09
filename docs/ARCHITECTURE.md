# Arquitectura — LifeOS

## Visión

App personal **anti-abandono**. El objetivo no es "tener muchas funciones", sino **reducir la fricción** para que el usuario actúe incluso sin motivación, y **aumentar la adherencia** con señales, recompensas y rachas.

## Capas

```
┌──────────────────────────────────────────────────────────┐
│  UI (React + Tailwind, dark, mobile-first)                │
│   - components/ui      → piezas tontas y reutilizables     │
│   - components/layout  → AppShell, BottomNav, SafeArea     │
│   - features/*         → cada módulo (dashboard, uni, …)   │
├──────────────────────────────────────────────────────────┤
│  Estado / Datos                                            │
│   - hooks/             → useCourses, useTasks, useHabits…  │
│   - TanStack Query     → cache + persistencia localStorage │
│   - stores/ (zustand)  → estado efímero (timer Pomodoro…)  │
├──────────────────────────────────────────────────────────┤
│  Acceso a datos                                            │
│   - lib/supabase.ts    → cliente Supabase (sesión persist.)│
│   - lib/db/*           → funciones tipadas por tabla       │
│   - lib/*              → grades, eisenhower, streaks, money │
├──────────────────────────────────────────────────────────┤
│  Supabase                                                  │
│   - Auth (email+password, sesión persistente)             │
│   - PostgreSQL + RLS (cada usuario ve solo lo suyo)        │
│   - Realtime (sincronización entre dispositivos)          │
│   - Edge Functions (enviar Web Push según recordatorios)  │
└──────────────────────────────────────────────────────────┘
```

## Estructura de carpetas

```
src/
├─ app/                 # App, Router, Providers
├─ components/
│  ├─ ui/               # Button, Card, Input, Sheet, Progress, EmptyState…
│  ├─ layout/           # AppShell, BottomNav, TopBar, SafeArea
│  └─ feedback/         # Toaster, ConfirmDialog
├─ features/
│  ├─ auth/             # Login, AuthProvider, AuthGuard
│  ├─ dashboard/        # Pantalla de inicio
│  ├─ university/       # Ramos, horario, evaluaciones, notas, alertas
│  ├─ tasks/            # Inbox GTD + matriz Eisenhower
│  ├─ crisis/           # Modo Crisis (tareas vencidas)
│  ├─ habits/           # Hábitos + rachas
│  ├─ focus/            # Pomodoro / Deep Work        (Fase 2)
│  ├─ finance/          # Finanzas                    (Fase 3)
│  ├─ calendar/         # Calendario día/semana/mes   (Fase 2)
│  └─ review/           # Revisión semanal            (Fase 2)
├─ hooks/               # hooks de datos transversales
├─ lib/                 # supabase, queryClient, utilidades de dominio
├─ stores/              # zustand (timer, UI)
├─ types/               # tipos de dominio + database.ts
└─ styles/              # index.css (tokens, safe-areas)

supabase/
├─ schema.sql           # tablas + RLS + triggers + vistas
└─ functions/           # Edge Functions (push)        (Fase notificaciones)
```

## Principios de diseño conductual aplicados

| Principio | Cómo se implementa en LifeOS |
|---|---|
| **Atomic Habits** | Hábitos con *cue* y *reward*, registro en 1 toque, **rachas visibles** ("no rompas la cadena"), apilado de hábitos. |
| **GTD** | **Inbox** de captura rápida, campo *próxima acción*, **Revisión semanal** automática. |
| **Deep Work** | Bloques **Pomodoro**, modo enfoque a pantalla completa sin distractores. |
| **Time Blocking** | Agendar tareas en el calendario; el horario de clases bloquea tiempo real. |
| **Eisenhower** | Toda tarea cae en un cuadrante (Hacer / Agendar / Delegar / Eliminar), calculado en la BD. |
| **Behavioral Design (Fogg)** | Hacer fácil la acción objetivo, *prompts* (recordatorios), **recompensas inmediatas** (puntos), y **Modo Crisis** que reduce la carga mostrando solo lo crítico. |

## Estrategia offline / "sensación híbrida"

- TanStack Query **persiste el cache en `localStorage`** → al abrir, la app muestra el último estado **al instante** y luego sincroniza con Supabase.
- El Service Worker cachea la app (offline) y las lecturas de Supabase (`NetworkFirst`).
- Las **escrituras** requieren conexión (con *optimistic updates* para que se sientan inmediatas). Una cola de escritura offline queda como mejora futura.

## Seguridad

- **RLS activado en todas las tablas**: las políticas exigen `user_id = auth.uid()`. Aunque alguien tuviera la `anon key` (es pública por diseño), no puede leer datos de otro usuario.
- Las claves de servicio (`service_role`) **solo** viven en Edge Functions, nunca en el frontend.
