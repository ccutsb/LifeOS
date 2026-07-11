# LifeOS 2.0 — De sistema académico a sistema operativo personal

> **Documento de auditoría y rediseño.** Nada de lo aquí descrito está implementado todavía.
> Autores de rol: Product Designer · Software Architect · Senior Frontend Engineer.
> Fecha: julio 2026 · Base auditada: commit `5aaf70f` (71 archivos, ~4.900 líneas TS/TSX).

---

## Parte 1 — Auditoría del sistema actual

### 1.1 Qué es LifeOS hoy

Una PWA (Vite + React 18 + TS + Tailwind + Supabase) con 13 módulos: Dashboard, Universidad,
Tareas (GTD + Eisenhower), Crisis, Hábitos, Enfoque (Pomodoro), Recompensas, Calendario,
Revisión semanal, Finanzas, Avisos, Más y Auth. El **centro de gravedad es el semestre**:
el dashboard gira en torno a clases/evaluaciones, el calendario pinta por ramo, la revisión
semanal sugiere "estudiar para X".

### 1.2 Fortalezas (conservar a toda costa)

| # | Fortaleza | Evidencia en el código |
|---|---|---|
| F1 | **Fricción mínima**: sesión persistente, captura rápida GTD, registro de hábito en 1 toque | `AuthProvider`, `TasksPage` quick-add, `HabitCard` |
| F2 | **Diseño conductual real**: puntos automáticos, rachas, Modo Crisis "una a la vez" | `points_ledger` + triggers, `streaks.ts`, `CrisisPage` |
| F3 | **Capa de datos sólida y genérica**: CRUD reutilizable + React Query persistido (abre al instante, lee offline) | `lib/crud.ts`, `queryClient.ts` |
| F4 | **El esquema ya anticipó esta evolución**: `tasks.energy`, `tasks.estimated_minutes`, `tasks.next_action`, `habits.weekdays`, `transactions.recurrence` existen en la BD **y la UI nunca los usó** | `schema.sql` vs `TaskFormSheet` (0 referencias) |
| F5 | Dominio desacoplado y testeable: `grades.ts`, `eisenhower.ts`, `streaks.ts` son funciones puras | `src/lib/*` |
| F6 | PWA iPhone bien resuelta (safe-areas, standalone, push preparado) | `index.html`, `push-sw.js` |
| F7 | RLS en todas las tablas; datos privados por diseño | `schema.sql` bloque final |

### 1.3 Debilidades (el diagnóstico del problema que describes)

| # | Debilidad | Raíz técnica |
|---|---|---|
| D1 | **Toda tarea pesa igual.** "Lavar loza" y "entregar trabajo final" compiten en la misma lista plana | No hay score: el orden es `sort_order, created_at`. Eisenhower depende de 2 toggles **manuales** |
| D2 | **Sin contexto/área.** El único contexto posible es `course_id` → todo lo no-académico queda "sin ramo" | `tasks` solo referencia `courses`; no existe entidad de contexto general |
| D3 | **Cero recurrencia en tareas.** "Lavar ropa cada domingo" hay que recrearla a mano cada semana | No hay columnas ni lógica de recurrencia en `tasks` (irónico: `transactions.recurrence` existe y tampoco se usa) |
| D4 | **El sistema registra, no decide.** El dashboard muestra listas; nunca responde "¿qué hago ahora?" | No existe motor de priorización ni noción de energía/tiempo disponible del usuario |
| D5 | **Sin objetivos.** No hay forma de agrupar tareas hacia una meta ("Certificación AWS") ni ver progreso | No existe entidad objetivo; `savings_goals` es solo dinero |
| D6 | **Sin rutinas.** La rutina de mañana/noche no se puede modelar; los hábitos son unitarios | `habits` es plano; no hay checklists agrupadas |
| D7 | **Estacionalidad ignorada.** En vacaciones, medio dashboard queda muerto (clases, evaluaciones) y nada lo reemplaza | Dashboard con secciones fijas académicas |
| D8 | Fecha límite no influye en urgencia automáticamente: `is_urgent` es manual aunque exista `isUrgentByDate()` sin conectar | `lib/eisenhower.ts` tiene la función; ningún flujo la llama |
| D9 | Administración creciente: clasificar (importante/urgente), decidir cuadrante, ordenar… el usuario trabaja para la app | Formularios piden decisiones que el sistema podría inferir |

### 1.4 Oportunidades

- **O1. El 60% del modelo nuevo ya existe** (F4): exponer campos dormidos > migrar todo.
- **O2. El motor de puntos/rachas es reutilizable** para chores y rutinas sin tocar backend.
- **O3. El Pomodoro ya integra tareas** → "¿Qué hago ahora?" puede desembocar directo en un bloque de enfoque (cerrar el ciclo decidir → hacer).
- **O4. Crisis Mode es un precedente**: ya hay un flujo que *decide por ti* cuando estás mal. La vista "Ahora" es su generalización positiva.
- **O5. Revisión semanal ya calcula métricas** → extenderla a balance por áreas es barato.

---

## Parte 2 — Decisiones de producto

### 2.1 Filosofía (sin cambios, ahora aplicada a toda la vida)

> LifeOS funciona **aunque no tengas motivación**. El sistema decide, tú ejecutas.
> Capturar = 5 segundos. Decidir = 0 segundos (lo hace el motor). Hacer = 1 toque para empezar.

### 2.2 Funcionalidades que ELIMINO o degrado

| Qué | Decisión | Por qué |
|---|---|---|
| **Matriz Eisenhower como vista principal** | Se elimina como pantalla. La urgencia pasa a ser **calculada** (fecha límite) y la importancia se hereda del área/objetivo o un solo toggle | Es la mayor fuente de administración manual (D9). El cuadrante "Delegar" no aplica a la vida personal de una persona |
| `is_urgent` manual | Se elimina del formulario; columna queda (compat) pero la escribe el sistema | D8 |
| Vista "Bandeja/Matriz/Hechas" con 3 tabs | Se simplifica: **una lista inteligente** ordenada por score + filtro por área | Menos decisiones de navegación |
| Secciones académicas fijas del Dashboard | Se vuelven **condicionales** (solo si el área Universidad está activa) | D7 |
| Página "Recompensas" en Más | Se mantiene pero baja de prioridad visual (no cambia) | Funciona; no estorba |

**Nada más se elimina.** Universidad, notas, Finanzas, Hábitos, Pomodoro, Crisis, Calendario y Revisión se conservan intactos en su lógica interna.

### 2.3 Funcionalidades que AGREGO

1. **Áreas de vida** (entidad de primera clase, no etiqueta).
2. **Recurrencia completa en tareas** (diaria / cada N días / semanal por días / mensual día X).
3. **Motor de priorización** (score automático multi-factor).
4. **Hoy** — dashboard rediseñado como *plan del día* generado.
5. **"¿Qué hago ahora?"** — recomendación de una sola acción según hora, energía y tiempo.
6. **Estado de energía** (alta/media/baja) de 1 toque, con expiración.
7. **Objetivos** (metas con tareas hijas y progreso).
8. **Rutinas** (checklists de mañana/noche/día de semana).
9. **Captura ultra-rápida global** (FAB central, chips inteligentes, < 5 s).
10. **Modo Semestre / Modo Vacaciones** (la app se reconfigura sola).

---

## Parte 3 — Rediseño UX

### 3.1 Nueva navegación

```
ANTES:  [Inicio] [Ramos] [Tareas] [Hábitos] [Más]
AHORA:  [Hoy]  [Tareas]  ( + )  [Áreas]  [Más]
                           │
                           └─ FAB central: captura rápida global (siempre visible)
```

- **Hoy** reemplaza al Dashboard: plan del día + botón "¿Qué hago ahora?".
- **Áreas** reemplaza a "Ramos" en la barra: grid de tus áreas; *Universidad es una área más*
  (dentro vive todo el módulo académico actual, intacto).
- **Hábitos** se accede desde Hoy (tarjeta) y desde el área Salud/Más — deja de ocupar un slot
  de barra que ahora necesita la captura.
- **Más** conserva: Enfoque, Calendario, Finanzas, Hábitos, Revisión, Recompensas, Crisis.

### 3.2 Wireframes conceptuales

**Pantalla HOY (nuevo dashboard):**
```
┌─────────────────────────────────────┐
│ jueves 10 de julio        ⚡142 🔔 2 │
│ Buenos días, Cristian.               │
│                                      │
│ ¿Cómo está tu energía?               │
│ [ 🔋 Alta ] [ ◐ Media ] [ 🪫 Baja ]  │  ← 1 toque, se recuerda 4 h
│                                      │
│ ┌──────────────────────────────────┐ │
│ │      ▶  ¿QUÉ HAGO AHORA?         │ │  ← botón héroe
│ └──────────────────────────────────┘ │
│                                      │
│ Plan de hoy                    3/7 ✓ │
│ ◉ Estudiar AWS          🎯 60m  🔋   │  ← ordenado por score
│ ◉ Lavar la loza         🏠 15m  🪫   │
│ ◉ Avanzar LifeOS        💻 45m  🔋   │
│ ○ Preparar almuerzo     🏠 30m       │
│ ○ Leer 20 min           📖 20m  ◐   │
│                                      │
│ ☀️ Rutina de mañana            4/5   │  ← tarjeta colapsable
│ 🔥 Hábitos                     2/4   │
│ 💰 Balance julio        +$182.000    │
└─────────────────────────────────────┘
│ [Hoy] [Tareas]  (+)  [Áreas] [Más]  │
```

**Vista "¿QUÉ HAGO AHORA?" (pantalla completa):**
```
┌─────────────────────────────────────┐
│                                  ✕  │
│   Tienes ~45 min y energía media    │  ← editable con chips
│   [15m] [30m] [45m] [1h] [2h+]      │
│                                      │
│        Te recomiendo:                │
│   ┌─────────────────────────────┐   │
│   │  📚 Estudiar AWS             │   │
│   │  Objetivo: Cert. Solutions   │   │
│   │  ~45 min · vence en 12 días  │   │
│   │  "Abrir el curso, módulo 3"  │   │  ← next_action (GTD)
│   └─────────────────────────────┘   │
│                                      │
│  [ ▶ Empezar (45 min de enfoque) ]  │  ← lanza Pomodoro vinculado
│                                      │
│   Otra sugerencia   ·   Ya la hice  │
└─────────────────────────────────────┘
```

**Captura rápida (FAB central → sheet):**
```
┌─────────────────────────────────────┐
│ ¿Qué hay que hacer?                  │
│ ┌──────────────────────────────────┐│
│ │ Lavar ropa_                      ││
│ └──────────────────────────────────┘│
│ Área:   [🏠 Hogar] 🎓 💻 ❤️ 📖 …    │  ← chips, default = última usada
│ Dura:   [15m] [30m] [1h] [2h]       │
│ Repite: [No] [Diario] [Sem] [Mes]   │  ← si eliges Sem: L M X J V S D
│ Energía:[🪫] [◐] [🔋]                │
│         [ Guardar ]                  │  ← Enter también guarda
└─────────────────────────────────────┘
Todo opcional salvo el título. 2 toques típicos: título + Guardar.
```

**Pantalla ÁREAS:**
```
┌─────────────────────────────────────┐
│ Áreas de vida                        │
│ ┌───────────┐ ┌───────────┐         │
│ │ 🎓 Universidad │ 💼 Trabajo │      │
│ │ 💤 en pausa │ │ 2 tareas  │        │  ← modo vacaciones
│ ├───────────┤ ├───────────┤         │
│ │ 🏠 Hogar   │ │ ❤️ Salud   │        │
│ │ 5 tareas ⚠️│ │ racha 6🔥 │         │
│ ├───────────┤ ├───────────┤         │
│ │ 💻 Proyectos│ │ 📖 D.Personal│     │
│ │ 2 objetivos│ │ 1 objetivo │        │
│ ├───────────┤ ├───────────┤         │
│ │ 💰 Finanzas│ │ 🎮 Ocio    │        │
│ └───────────┘ └───────────┘         │
└─────────────────────────────────────┘
Tocar un área → sus objetivos, tareas, y (Universidad) ramos/notas/horario.
```

**Detalle de OBJETIVO:**
```
┌─────────────────────────────────────┐
│ ← 🎯 Certificación AWS SAA           │
│ Área: 📖 Desarrollo personal         │
│ Meta: 30 sept · ████████░░░░ 8/13   │
│                                      │
│ Siguiente paso sugerido:             │
│ ▸ Módulo 3: VPC y networking (60m)  │
│                                      │
│ Tareas    [+ agregar]                │
│ ✓ Crear cuenta AWS free tier         │
│ ✓ Módulos 1-2                        │
│ ○ Módulo 3: VPC (60m 🔋)            │
│ ○ Práctica: desplegar EC2 (45m 🔋)  │
└─────────────────────────────────────┘
```

### 3.3 Flujo de navegación

```
                    ┌─────────┐
        ┌──────────▶│   HOY   │◀─ push/avisos aterrizan aquí
        │           └────┬────┘
        │    ┌───────────┼───────────────┐
        │    ▼           ▼               ▼
        │ ¿Qué hago   Plan del día    Tarjetas (rutina/hábitos/finanzas)
        │  ahora?      (toggle ✓)          │
        │    │ Empezar                     ▼
        │    ▼                        módulo respectivo
        │ ENFOQUE (pomodoro con tarea vinculada)
        │
   (+) captura ─── guarda ──▶ el motor la ubica solo (sin decidir dónde)
        │
     ÁREAS ──▶ área ──▶ objetivos / tareas del área
                 └─▶ Universidad = módulo académico completo actual
```

### 3.4 Reglas del motor de priorización (v1, transparente y determinista)

```
score(tarea) =
    urgencia      0–40   e^decay sobre días hasta vencer (vencida = 40)
  + importancia   0–20   objetivo activo +12 · área prioritaria +8 · toggle manual +20 (cap 20)
  + staleness     0–15   recurrentes: días_desde_última / intervalo (cap 15)
                         no recurrentes: días en lista / 7 (cap 8)
  + fit energía   0–10   coincide con energía actual 10 · adyacente 5 · opuesta 0
  + fit tiempo    0–10   cabe en el hueco disponible 10 · no cabe 0
  + variedad      0–5    área no tocada hoy +5 (evita días monotemáticos)
```

- "Plan de hoy" = top N que sume ≤ presupuesto de minutos del día (default 4 h configurables).
- "¿Qué hago ahora?" = mismo score con `fit tiempo` y `fit energía` como **filtros duros** primero,
  y desempate aleatorio entre los 2 primeros (evita fatiga de ver siempre lo mismo).
- Sin IA/servidor: función pura `planner.ts`, testeable con Vitest. Explicable: la tarjeta puede
  decir *por qué* ("vence pronto · coincide con tu energía").

---

## Parte 4 — Modelo de datos (migración v2)

### 4.1 Entidades nuevas

```sql
-- Áreas de vida (semilla automática al crear perfil + backfill)
create table life_areas (
  id uuid pk, user_id uuid,
  name text, icon text, color text,
  kind text check (kind in ('university','work','home','health','finance',
                            'growth','projects','leisure','custom')),
  is_active boolean default true,     -- Universidad => false en vacaciones
  priority int default 0,             -- pesa en el score
  sort_order int
);

-- Objetivos (metas con progreso)
create table objectives (
  id uuid pk, user_id uuid,
  area_id uuid references life_areas,
  title text, description text,
  target_date date,
  status text check (status in ('active','paused','done','dropped')) default 'active'
);

-- Rutinas (checklists por franja/día)
create table routines (
  id uuid pk, user_id uuid,
  name text, icon text,
  trigger_kind text check (trigger_kind in ('morning','evening','weekday')) ,
  weekdays int[] default '{0,1,2,3,4,5,6}',
  is_active boolean default true
);
create table routine_items (
  id uuid pk, user_id uuid, routine_id uuid references routines on delete cascade,
  title text, sort_order int
);
create table routine_logs (
  id uuid pk, user_id uuid, routine_item_id uuid references routine_items on delete cascade,
  log_date date, done boolean default true,
  unique (routine_item_id, log_date)
);
```

### 4.2 Cambios a tablas existentes (aditivos, sin romper nada)

```sql
alter table tasks add column area_id uuid references life_areas on delete set null;
alter table tasks add column objective_id uuid references objectives on delete set null;
alter table tasks add column recurrence jsonb;         -- null = tarea única
alter table tasks add column last_completed_at timestamptz;  -- staleness de recurrentes
alter table courses add column area_id uuid references life_areas;  -- → área Universidad
alter table profiles add column life_mode text default 'semestre'
  check (life_mode in ('semestre','vacaciones'));
-- energía actual: profiles.settings->>'energy' + '...expires_at' (jsonb existente, sin ALTER)
```

**Formato de `recurrence`** (subset pragmático de RRULE, resuelto en `lib/recurrence.ts`):
```json
{ "freq": "daily" }                        // todos los días
{ "freq": "weekly",  "byweekday": [0] }    // cada domingo
{ "freq": "interval","days": 15 }          // cada 15 días
{ "freq": "monthly", "bymonthday": 5 }     // el día 5 (pagar internet)
```
Al completar una recurrente: se marca `last_completed_at` y **la misma fila** recalcula su próximo
`due_at` (no se generan filas infinitas; el historial vive en `points_ledger` y estadísticas).

### 4.3 Compatibilidad

- `is_urgent`/`quadrant` quedan en la BD (nada se rompe) pero la UI ya no los pide: la urgencia
  la escribe el sistema desde `due_at`.
- Tareas existentes: backfill `area_id` = Universidad si tienen `course_id`, si no `NULL`
  (aparecen como "Sin área" y se reclasifican al tocarlas).
- Migración en `supabase/migration-v2.sql`, idempotente, mismo estilo que `schema.sql`.

---

## Parte 5 — Cambios de arquitectura

```
src/
├─ lib/
│  ├─ planner.ts        ★ NUEVO  motor de score + plan del día + "ahora" (puro, testeado)
│  ├─ recurrence.ts     ★ NUEVO  próxima ocurrencia + descripción legible ("cada domingo")
│  ├─ energy.ts         ★ NUEVO  estado de energía (settings jsonb + expiración 4 h)
│  └─ eisenhower.ts     ─ queda solo como input interno del planner (sin UI propia)
├─ features/
│  ├─ today/            ★ NUEVO  reemplaza dashboard/ (HoyPage + PlanList + EnergyPicker)
│  ├─ now/              ★ NUEVO  NowScreen ("¿Qué hago ahora?")
│  ├─ areas/            ★ NUEVO  AreasPage + AreaDetailPage (+ formularios)
│  ├─ objectives/       ★ NUEVO  ObjectiveDetail + form
│  ├─ routines/         ★ NUEVO  RoutineCard + editor
│  ├─ capture/          ★ NUEVO  QuickCaptureSheet global (FAB)
│  ├─ university/       ─ intacto, se monta dentro de AreaDetail(kind=university)
│  └─ dashboard/        ✝ se elimina (absorbido por today/)
└─ stores/
   └─ session.ts        ★ NUEVO  zustand: energía actual, tiempo disponible, modo de vida
```

- **Cero dependencias nuevas.** El motor es TypeScript puro; recurrencia con `date-fns` ya presente.
- **Testing entra al proyecto** (Vitest) exclusivamente para `planner.ts` y `recurrence.ts` —
  son el corazón de "el sistema decide"; un bug ahí destruye la confianza en la app.
- React Query sigue igual (F3); solo se agregan hooks `useAreas`, `useObjectives`, `useRoutines`.
- El bundle se divide con `React.lazy` por ruta (aprovechando que tocamos el router): resuelve
  el warning actual de 600 kB.

---

## Parte 6 — Roadmap de implementación

> Cada fase termina **usable y desplegada**. Nunca hay una semana sin app funcional.

### Fase 5 — Fundaciones de vida *(la base de datos aprende a ser persona)*
- `migration-v2.sql`: áreas + objetivos + rutinas + columnas nuevas + semillas + backfill.
- CRUD de áreas (con seed de 8 default) · página Áreas (grid) · Universidad como área.
- Captura rápida global (FAB central) con chips: área, duración, energía, recurrencia.
- Recurrencia funcionando end-to-end (`recurrence.ts` + recálculo al completar + descripción legible).
- Exponer al fin `estimated_minutes` y `energy` en formularios.
- **Entregable:** capturas "lavar loza, 15m, hogar, diario" en 5 segundos y renace sola cada día.

### Fase 6 — El sistema decide *(el corazón del rediseño)*
- `planner.ts` + tests (score, plan del día, recomendación).
- Página **Hoy** (reemplaza Dashboard): saludo, selector de energía, plan generado, tarjetas.
- Pantalla **"¿Qué hago ahora?"** → botón "Empezar" lanza Pomodoro con la tarea vinculada.
- Navegación nueva (Hoy / Tareas / + / Áreas / Más) y lista de tareas única ordenada por score
  (adiós tabs Matriz/Bandeja).
- **Entregable:** abres la app, tocas tu energía, tocas "¿Qué hago ahora?" y ejecutas. Cero decisiones.

### Fase 7 — Objetivos y rutinas *(dirección y estructura)*
- Objetivos: CRUD + progreso + "siguiente paso" + boost en el score.
- Rutinas: editor + tarjetas en Hoy (mañana/noche/día) + logs.
- Modo **Semestre/Vacaciones**: toggle en Más; pausa el área Universidad y reconfigura Hoy/planner.
- **Entregable:** "Certificación AWS" con 13 tareas y % de avance; rutina de mañana con checklist.

### Fase 8 — Pulido e inteligencia *(cerrar el círculo)*
- Revisión semanal por áreas (balance: dónde invertiste la semana) + racha de rutinas.
- Estadísticas del planner (aciertos: recomendado→hecho).
- Code-splitting por ruta, onboarding de áreas para usuarios nuevos, export/import respaldo.
- **Entregable:** la revisión del domingo te muestra tu vida completa, no solo la universidad.

### Estimación de esfuerzo relativo

| Fase | Tamaño | Riesgo | Dependencias |
|---|---|---|---|
| 5 | ●●●○ | Bajo (aditivo) | — |
| 6 | ●●●● | Medio (UX nueva) | Fase 5 |
| 7 | ●●○○ | Bajo | Fase 5 |
| 8 | ●●○○ | Bajo | Fases 6-7 |

---

## Apéndice — Qué NO haremos (y por qué)

- **IA generativa para planificar**: el motor determinista es gratis, instantáneo, offline y
  explicable. Una API de IA agrega latencia, costo y opacidad justo donde necesitas confianza.
- **Time-blocking automático en calendario**: sobre-ingeniería para una persona; el plan del día
  con presupuesto de minutos logra el 90% del valor con 10% de la rigidez.
- **App separada de "vida"**: exactamente lo contrario de tu pedido — todo converge en Hoy.
- **Gamificación extra (niveles, logros, avatares)**: los puntos/rachas actuales bastan;
  más juego = más ruido = menos "sin distractores".
