# Roadmap — LifeOS

Construcción **MVP-first**: primero algo que ya uses en tu iPhone esta semana (victoria temprana = no abandonar), luego crece.

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
