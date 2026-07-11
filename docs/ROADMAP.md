# Roadmap — LifeOS

Construcción **MVP-first**: primero algo que ya uses en tu iPhone esta semana (victoria temprana = no abandonar), luego crece.

> **LifeOS 2.0:** el rediseño hacia "sistema operativo personal" vive en
> [`EVOLUTION.md`](EVOLUTION.md). Fases 5 y 6 implementadas (ver abajo).

## Fase 0 — Cimientos ✅ COMPLETA
- [x] Proyecto Vite + React + TS + Tailwind
- [x] PWA (manifest, íconos iOS, offline)
- [x] Base de datos completa + RLS + triggers (`supabase/schema.sql`) — verificada en producción
- [x] Cliente Supabase + Auth (sesión persistente)
- [x] Navegación (AppShell + BottomNav) + design system base
- [x] Tema oscuro + safe-areas iPhone

## Fase 1 — MVP usable ✅ COMPLETA
- [x] **Auth**: registro / login / logout, guard de rutas
- [x] **Dashboard**: tareas de hoy, próximas evaluaciones, próximas clases, hábitos del día, puntos, banner de crisis
- [x] **Universidad**: CRUD de ramos, horario, evaluaciones, **cálculo de notas 1.0–7.0** (promedio ponderado, nota necesaria, proyección, eximición)
- [x] **Tareas**: inbox GTD + captura rápida + **matriz Eisenhower** + completar/posponer
- [x] **Modo Crisis**: detecta tareas vencidas → solo lo crítico + plan de rescate ordenado
- [x] **Hábitos**: hábitos base, registro en 1 toque, **rachas** + puntos
- [x] **Alertas automáticas** + bandeja de notificaciones in-app

## Fase 2 — Productividad profunda ✅ COMPLETA
- [x] **Pomodoro / Deep Work**: temporizador con anillo, cuenta regresiva, fases, estadísticas semanales
- [x] **Recompensas**: puntos por tarea/hábito/pomodoro + tienda de recompensas con canje
- [x] **Calendario**: vistas día / semana / mes (tareas, evaluaciones, clases)
- [x] **Revisión semanal automática**: métricas + qué salió bien / mal / próximas prioridades (editable y guardable)

## Fase 3 — Finanzas ✅ COMPLETA
- [x] Ingresos y gastos, categorías
- [x] Presupuesto por categoría (con gasto del mes vs límite)
- [x] Metas de ahorro + **ahorro automático** (% de cada ingreso) + abono manual
- [x] Resumen financiero en el dashboard

## Fase 4 — Notificaciones push reales + pulido
- [x] Cliente: suscripción push + service worker con `push`/`notificationclick`
- [x] Edge Function `send-reminders` + generación de recordatorios (`reminders.sql`) + cron (código listo)
- [ ] **Pendiente de despliegue (tú):** generar VAPID, `supabase functions deploy`, secrets y cron — ver `docs/DEPLOYMENT.md` §7
- [ ] Exportar / importar respaldo (JSON)
- [ ] Code-splitting del bundle, onboarding guiado, eventos de calendario propios

## Fase 5 — Fundaciones de vida (LifeOS 2.0) ✅ COMPLETA
- [x] `migration-v2.sql`: áreas de vida, objetivos, rutinas, recurrencia, `life_mode`, semillas + backfill
- [x] Áreas de vida: grid, detalle, crear/editar/pausar (Universidad = un área más)
- [x] Captura rápida global (FAB central): título + chips de área/duración/repetición/energía
- [x] Recurrencia end-to-end: la misma tarea renace sola al completarse (`lib/recurrence.ts` + tests)
- [x] `estimated_minutes` y `energy` expuestos al fin en formularios

## Fase 6 — El sistema decide (LifeOS 2.0) ✅ COMPLETA
- [x] Motor de priorización `lib/planner.ts` (score explicable) + 23 tests con Vitest
- [x] Página **Hoy** (reemplaza Dashboard): energía, plan del día generado, tarjetas condicionales
- [x] Vista **"¿Qué hago ahora?"**: 1 recomendación según tiempo/energía → lanza Pomodoro
- [x] Navegación nueva: [Hoy] [Tareas] (+) [Áreas] [Más]; lista de tareas única ordenada por score
- [x] Matriz Eisenhower eliminada como vista (urgencia ahora es calculada)

## Fase 7 — Objetivos y rutinas (LifeOS 2.0) ✅ COMPLETA
- [x] Objetivos: CRUD + progreso (tareas hechas/total) + "siguiente paso" sugerido + boost en el score
- [x] Rutinas mañana/noche/día con checklists editables + tarjetas colapsables en Hoy
- [x] Modo Semestre 🎓 / Vacaciones 🌴 (toggle en Más) que pausa/reactiva Universidad y sus alertas

## Fase 8 — Pulido e inteligencia (LifeOS 2.0) ✅ COMPLETA
- [x] Revisión semanal por áreas (barras de minutos invertidos por área + métricas guardadas)
- [x] Code-splitting por ruta (10 páginas secundarias en chunks lazy)
- [x] Onboarding de áreas (tarjeta de semilla si la cuenta no tiene áreas)
- [x] Exportar / importar respaldo JSON completo (en Más)
