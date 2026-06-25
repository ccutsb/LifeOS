# LifeOS

**Tu sistema operativo personal para la vida universitaria.** Una PWA instalable que reúne
universidad, tareas, hábitos, enfoque, finanzas y objetivos en una sola aplicación móvil,
diseñada con un principio rector: **reducir la fricción para que actúes incluso sin motivación**.

LifeOS no busca ser otra app de tareas. Es un *cockpit de ejecución* que cierra el ciclo
**capturar → decidir → ejecutar → revisar**, con diseño conductual (Atomic Habits, GTD, Deep Work,
Time Blocking, matriz de Eisenhower) aplicado de forma concreta y sin curva de aprendizaje.

---

## Características

| Módulo | Qué resuelve |
|---|---|
| **Inicio** | Resumen del día: tareas de hoy, próximas evaluaciones y clases, progreso de hábitos, balance del mes y alertas. |
| **Universidad** | Ramos, horario y evaluaciones con cálculo de notas en escala chilena 1.0–7.0: promedio ponderado, nota necesaria para aprobar, proyección y eximición. |
| **Tareas** | Bandeja de captura rápida (GTD) y matriz de Eisenhower con clasificación automática por urgencia/importancia. |
| **Hábitos** | Hábitos con señal y recompensa (Atomic Habits), registro en un toque, rachas y recordatorios por horario. |
| **Enfoque** | Temporizador Pomodoro / Deep Work con anillo de progreso, fases y estadística semanal. |
| **Finanzas** | Ingresos y gastos por categoría, billeteras/cuentas (banco, MercadoPago, beca, efectivo…), presupuestos, metas de ahorro y ahorro automático. |
| **Objetivos** | Objetivos de vida por área que conectan tareas y hábitos, con progreso derivado de lo completado. |
| **Calendario** | Vistas de día, semana y mes con tareas, evaluaciones y clases. |
| **Revisión semanal** | Métricas y reflexión guiada (qué salió bien, qué salió mal, próximas prioridades) generada automáticamente. |
| **Modo Crisis** | Cuando hay tareas vencidas, muestra solo lo crítico y un plan de rescate ordenado. |
| **Notificaciones** | Avisos in-app, recordatorios locales en el dispositivo y Web Push real (iOS 16.4+ con la PWA instalada). |

## Principios de diseño

- **Anti-abandono.** La meta no es acumular funciones, sino que el usuario actúe con la mínima
  fricción posible. La métrica norte es *tiempo hasta el primer valor* y *toques para la acción más común*.
- **Cero curva de aprendizaje.** El sistema viene armado; no hay que configurar nada para obtener valor.
- **Diseño conductual.** Señales (recordatorios), recompensas inmediatas (puntos y rachas) y reducción
  de carga cognitiva (Modo Crisis) aplicados de forma deliberada.
- **Local-first en sensación.** El estado se persiste en el cliente para abrir al instante; la
  sincronización ocurre en segundo plano.

## Stack tecnológico

- **Frontend:** Vite, React 18, TypeScript y Tailwind CSS.
- **Backend:** Supabase (autenticación, PostgreSQL con Row Level Security, Edge Functions).
- **Datos y caché:** TanStack Query con persistencia en `localStorage` (apertura instantánea y lectura offline).
- **PWA:** vite-plugin-pwa (instalable, offline, íconos y splash de iOS).
- **Gamificación:** puntos otorgados por triggers en PostgreSQL (server-authoritative, sin doble conteo).
- **Notificaciones:** recordatorios locales en el dispositivo y Web Push vía Edge Function.

## Arquitectura

La aplicación sigue una estructura por *features*: cada módulo de `src/features/*` agrupa su UI,
sus hooks de datos y su lógica. El acceso a datos se centraliza en `src/lib` (cliente de Supabase,
TanStack Query y utilidades de dominio como cálculo de notas, Eisenhower y rachas).

```
src/
├─ app/                 App, router y providers
├─ components/          UI reutilizable (ui/, layout/, feedback/)
├─ features/            Un directorio por módulo (university, tasks, habits, finance, objectives…)
├─ hooks/               Hooks de datos transversales
├─ lib/                 Supabase, TanStack Query y utilidades de dominio
├─ stores/              Estado efímero con Zustand (temporizador Pomodoro)
├─ types/               Tipos de dominio y espejo del esquema de base de datos
└─ styles/              Tokens de diseño y safe-areas

supabase/
├─ schema.sql           Esquema completo: tablas, RLS, triggers y vistas
├─ wallets.sql          Migración: billeteras/cuentas
├─ points.sql           Migración: puntos server-authoritative
├─ objectives.sql       Migración: objetivos de vida
├─ reminders.sql        Generación de recordatorios (push)
└─ functions/           Edge Functions (envío de Web Push)
```

Para más detalle, consulta [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Puesta en marcha (local)

Requisitos: Node 20+ y una cuenta gratuita de Supabase.

```bash
npm install
cp .env.example .env          # completa con tus claves de Supabase
npm run generate:pwa-assets   # genera íconos de la PWA desde public/logo.svg
npm run dev                   # http://localhost:5173
```

### Base de datos

En el SQL Editor de Supabase, ejecuta [`supabase/schema.sql`](supabase/schema.sql). Es idempotente:
puedes volver a correrlo sin perder datos. Incluye todas las tablas, políticas de RLS, triggers y
vistas. Las migraciones de `supabase/` (`wallets.sql`, `points.sql`, `objectives.sql`) están incluidas
en el esquema y también se distribuyen por separado para bases creadas con versiones anteriores.

La guía completa de despliegue (Supabase, Vercel, notificaciones push e instalación en iPhone) está en
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (accesible desde el iPhone en la misma red). |
| `npm run build` | Build de producción. |
| `npm run preview` | Previsualiza el build de producción. |
| `npm run typecheck` | Verificación de tipos con TypeScript. |
| `npm test` | Ejecuta la suite de tests (Vitest). |
| `npm run generate:pwa-assets` | Regenera íconos y splash desde `public/logo.svg`. |

## Calidad

- **Tipado estricto** con TypeScript en todo el código.
- **Tests** de la lógica de dominio (cálculo de notas, Eisenhower, rachas y dinero) con Vitest.
- **Integración continua** en GitHub Actions: typecheck, tests y build en cada push y pull request.
- **Seguridad:** Row Level Security en todas las tablas (cada usuario solo accede a sus datos) y
  gamificación gestionada en el servidor.

## Documentación

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — capas, estructura y decisiones de diseño.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — configuración de Supabase, despliegue y notificaciones.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — fases del proyecto y trabajo futuro.
