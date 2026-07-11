# LifeOS

**Tu sistema operativo personal.** Una PWA instalable que organiza universidad, trabajo, hogar,
salud, finanzas y proyectos en una sola aplicación móvil, diseñada con un principio rector:
**reducir la fricción para que actúes incluso sin motivación**.

LifeOS no es otra app de tareas. Es un *cockpit de decisión* que cierra el ciclo
**capturar → decidir → ejecutar → revisar**, con diseño conductual (Atomic Habits, GTD, Deep Work,
Time Blocking, matriz de Eisenhower) aplicado de forma concreta y sin curva de aprendizaje. El
sistema no se limita a listar lo pendiente: **decide por ti qué hacer ahora** según urgencia,
importancia, energía disponible y tiempo libre.

---

## Características

### El núcleo: decidir, no solo listar

| Módulo | Qué resuelve |
|---|---|
| **Hoy** | Pantalla de inicio: energía del momento, plan del día generado automáticamente, rutinas pendientes, hábitos, universidad (si está activa) y balance financiero. |
| **¿Qué hago ahora?** | Botón héroe que recomienda **una sola tarea** según tu tiempo disponible y energía, con la razón de por qué, y la lanza directo a un Pomodoro. |
| **Tareas** | Lista única ordenada por un motor de priorización explicable (no una matriz manual): urgencia, importancia, tiempo sin hacerse, energía requerida y variedad de áreas. Captura rápida global (botón +) con chips de 1 toque. |
| **Áreas de vida** | Universidad, Trabajo, Hogar, Salud, Finanzas, Desarrollo personal, Proyectos, Ocio (+ personalizadas). Cada tarea pertenece a un área; las áreas se pueden **pausar** (p. ej. Universidad en vacaciones) o marcar como prioritarias. |
| **Objetivos** | Metas por área ("Certificación AWS") con checklist de tareas, progreso y siguiente paso sugerido. Empujan el plan del día mientras están activos. |
| **Rutinas** | Checklists de mañana, noche o días específicos que aparecen en Hoy solo cuando corresponde. |
| **Recurrencia** | Tareas que se repiten a diario, semanalmente por días, cada N días o el día X de cada mes — la misma tarea renace sola al completarse, sin recrearla a mano. |
| **Modo Semestre / Vacaciones** | Un toggle pausa el área Universidad (y sus alertas) cuando no hay clases, sin perder el histórico. |

### Módulos de dominio

| Módulo | Qué resuelve |
|---|---|
| **Universidad** | Ramos, horario y evaluaciones con cálculo de notas en escala chilena 1.0–7.0: promedio ponderado, nota necesaria para aprobar, proyección y eximición. |
| **Hábitos** | Hábitos con señal y recompensa (Atomic Habits), registro en un toque, rachas y recordatorios por horario. |
| **Enfoque** | Temporizador Pomodoro / Deep Work con anillo de progreso, fases y estadística semanal. |
| **Finanzas** | Ingresos y gastos por categoría, billeteras/cuentas (banco, MercadoPago, beca, efectivo…) con transferencias entre ellas, presupuestos, metas de ahorro y ahorro automático. |
| **Calendario** | Vistas de día, semana y mes con tareas, evaluaciones y clases. |
| **Revisión semanal** | Métricas y balance de tiempo **por área de vida**, más reflexión guiada (qué salió bien, qué salió mal, próximas prioridades) generada automáticamente. |
| **Modo Crisis** | Cuando hay tareas vencidas, muestra solo lo crítico y un plan de rescate ordenado. |
| **Notificaciones** | Avisos in-app, recordatorios locales en el dispositivo (por entrega y por hábito) y Web Push real (iOS 16.4+ con la PWA instalada). |
| **Respaldo** | Exporta todos tus datos a un archivo JSON e impórtalos cuando quieras, desde Más. |

## Principios de diseño

- **Anti-abandono.** La meta no es acumular funciones, sino que el usuario actúe con la mínima
  fricción posible. La métrica norte es *tiempo hasta el primer valor* y *toques para la acción más común*.
- **El sistema decide, tú ejecutas.** La prioridad no se marca a mano: se calcula. "¿Qué hago
  ahora?" existe porque decidir consume la misma energía que hacer.
- **Vida completa, no solo estudio.** Las áreas de vida son ciudadanas de primera clase; la
  universidad es una más, no el centro del sistema — se puede pausar sin perder nada.
- **Cero curva de aprendizaje.** El sistema viene armado con áreas y onboarding; no hay que
  configurar nada para obtener valor desde el primer minuto.
- **Diseño conductual.** Señales (recordatorios), recompensas inmediatas (puntos y rachas) y
  reducción de carga cognitiva (Modo Crisis) aplicados de forma deliberada.
- **Local-first en sensación.** El estado se persiste en el cliente para abrir al instante; la
  sincronización ocurre en segundo plano.

## Stack tecnológico

- **Frontend:** Vite, React 18, TypeScript y Tailwind CSS.
- **Backend:** Supabase (autenticación, PostgreSQL con Row Level Security, Edge Functions).
- **Datos y caché:** TanStack Query con persistencia en `localStorage` (apertura instantánea y lectura offline).
- **Estado efímero:** Zustand (temporizador Pomodoro, energía/tiempo disponible de la sesión).
- **PWA:** vite-plugin-pwa (instalable, offline, íconos y splash de iOS), con code-splitting por ruta.
- **Gamificación:** puntos otorgados por triggers en PostgreSQL (server-authoritative, sin doble conteo).
- **Notificaciones:** recordatorios locales en el dispositivo y Web Push vía Edge Function.

## Arquitectura

La aplicación sigue una estructura por *features*: cada módulo de `src/features/*` agrupa su UI,
sus hooks de datos y su lógica. El acceso a datos se centraliza en `src/lib` (cliente de Supabase,
TanStack Query y utilidades de dominio como cálculo de notas, recurrencia y el **motor de
priorización**).

```
src/
├─ app/                 App, router (con code-splitting) y providers
├─ components/          UI reutilizable (ui/, layout/, feedback/)
├─ features/
│  ├─ today/            Pantalla Hoy (plan del día)
│  ├─ now/               "¿Qué hago ahora?"
│  ├─ areas/             Áreas de vida (grid, detalle, onboarding)
│  ├─ objectives/        Objetivos por área
│  ├─ routines/          Rutinas con checklists
│  ├─ capture/           Captura rápida global + selector de recurrencia
│  ├─ tasks/             Lista de tareas + Eisenhower automático
│  ├─ university/        Ramos, horario, evaluaciones, notas
│  ├─ habits/            Hábitos y rachas
│  ├─ focus/             Pomodoro / Deep Work
│  ├─ finance/           Ingresos, gastos, cuentas, transferencias, ahorro
│  ├─ calendar/          Vistas día/semana/mes
│  ├─ review/            Revisión semanal por áreas
│  ├─ crisis/            Modo Crisis
│  ├─ rewards/           Tienda de recompensas
│  ├─ notifications/     Alertas in-app y recordatorios locales/push
│  ├─ backup/            Exportar/importar respaldo JSON
│  ├─ onboarding/        Bienvenida de primer uso
│  └─ auth/              Login y guard de sesión
├─ hooks/               Hooks de datos transversales (perfil, contexto del planner)
├─ lib/                 Supabase, TanStack Query, planner, recurrencia, notas, dinero…
├─ stores/              Estado efímero con Zustand (foco, sesión, toasts)
├─ types/               Tipos de dominio y espejo del esquema de base de datos
└─ styles/              Tokens de diseño (tema claro/oscuro) y safe-areas

supabase/
├─ schema.sql           Esquema base: tablas, RLS, triggers y vistas
├─ migration-v2.sql     LifeOS 2.0: áreas, objetivos, rutinas, recurrencia, modo vacaciones
├─ wallets.sql          Migración: billeteras/cuentas
├─ transfers.sql        Migración: transferencias entre cuentas
├─ points.sql           Migración: puntos server-authoritative
├─ objectives.sql       Migración legada: objetivos de vida (migrada por migration-v2.sql)
├─ reminders.sql        Generación de recordatorios (push)
└─ functions/           Edge Functions (envío de Web Push)
```

Para más detalle, consulta [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) y el diseño del
rediseño 2.0 en [`docs/EVOLUTION.md`](docs/EVOLUTION.md).

## Puesta en marcha (local)

Requisitos: Node 20+ y una cuenta gratuita de Supabase.

```bash
npm install
cp .env.example .env          # completa con tus claves de Supabase
npm run generate:pwa-assets   # genera íconos de la PWA desde public/logo.svg
npm run dev                   # http://localhost:5173
```

### Base de datos

En el SQL Editor de Supabase, ejecuta en orden:

1. [`supabase/schema.sql`](supabase/schema.sql) — esquema base completo.
2. [`supabase/migration-v2.sql`](supabase/migration-v2.sql) — LifeOS 2.0: áreas de vida, objetivos,
   rutinas y recurrencia. Crea tus 8 áreas por defecto y, si venías de una versión anterior, migra
   tus objetivos y datos existentes automáticamente.

Ambos scripts son idempotentes: puedes volver a correrlos sin perder datos. Si tu base viene de una
versión intermedia, las migraciones mínimas también existen por separado:
[`wallets.sql`](supabase/wallets.sql), [`transfers.sql`](supabase/transfers.sql) y
[`points.sql`](supabase/points.sql).

La guía completa de despliegue (Supabase, Vercel, notificaciones push e instalación en iPhone) está en
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (accesible desde el iPhone en la misma red). |
| `npm run build` | Build de producción (con code-splitting por ruta). |
| `npm run preview` | Previsualiza el build de producción. |
| `npm run typecheck` | Verificación de tipos con TypeScript. |
| `npm test` | Ejecuta la suite de tests (Vitest). |
| `npm run test:watch` | Tests en modo watch. |
| `npm run generate:pwa-assets` | Regenera íconos y splash desde `public/logo.svg`. |

## Calidad

- **Tipado estricto** con TypeScript en todo el código.
- **Tests** de la lógica de dominio con Vitest: motor de priorización, recurrencia, cálculo de
  notas, Eisenhower, rachas, dinero y balance de cuentas.
- **Integración continua** en GitHub Actions: typecheck, tests y build en cada push y pull request.
- **Seguridad:** Row Level Security en todas las tablas (cada usuario solo accede a sus datos) y
  gamificación gestionada en el servidor (imposible duplicar puntos desde el cliente).

## Documentación

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — capas, estructura y decisiones de diseño.
- [`docs/EVOLUTION.md`](docs/EVOLUTION.md) — diseño del rediseño LifeOS 2.0 (áreas, planner, UX).
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — configuración de Supabase, despliegue y notificaciones.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — fases del proyecto y trabajo futuro.
