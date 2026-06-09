# Roadmap — LifeOS

Construcción **MVP-first**: primero algo que ya uses en tu iPhone esta semana (victoria temprana = no abandonar), luego crece.

## Fase 0 — Cimientos ✅ (en curso)
- [x] Proyecto Vite + React + TS + Tailwind
- [x] PWA (manifest, íconos iOS, offline)
- [x] Base de datos completa + RLS + triggers (`supabase/schema.sql`)
- [ ] Cliente Supabase + Auth (sesión persistente)
- [ ] Navegación (AppShell + BottomNav) + design system base
- [ ] Tema oscuro + safe-areas iPhone

## Fase 1 — MVP usable 🎯 (esta semana)
- [ ] **Auth**: registro / login / logout, guard de rutas
- [ ] **Dashboard**: tareas de hoy, próximas evaluaciones, próximas clases, hábitos del día, mini-resumen
- [ ] **Universidad**: CRUD de ramos, horario, evaluaciones, **cálculo de notas 1.0–7.0** (promedio ponderado, nota necesaria, proyección, eximición), alertas de entregas
- [ ] **Tareas**: inbox GTD + **matriz Eisenhower** + completar/posponer
- [ ] **Modo Crisis**: detectar tareas vencidas → mostrar solo lo crítico + plan de rescate
- [ ] **Hábitos**: hábitos base (dormir, asistencia, estudio, ejercicio, comida), registro en 1 toque, **rachas**
- [ ] **Recordatorios locales** + bandeja de notificaciones in-app

## Fase 2 — Productividad profunda
- [ ] **Pomodoro / Deep Work**: temporizador, bloques de enfoque, cuenta regresiva, estadísticas semanales
- [ ] **Recompensas**: puntos por completar + tienda de recompensas
- [ ] **Calendario**: vistas día / semana / mes (tareas, evaluaciones, clases, eventos)
- [ ] **Revisión semanal automática**: qué salió bien / mal / próximas prioridades

## Fase 3 — Finanzas
- [ ] Ingresos y gastos, categorías
- [ ] Presupuesto por categoría
- [ ] Metas de ahorro + **ahorro automático** (regla % o monto al recibir ingreso)
- [ ] Resumen financiero en el dashboard

## Fase 4 — Notificaciones push reales + pulido
- [ ] Edge Function `send-reminders` + cron (envía Web Push)
- [ ] Suscripción push desde el iPhone (PWA instalada, iOS 16.4+)
- [ ] Exportar / importar respaldo (JSON)
- [ ] Animaciones, accesibilidad, optimización de rendimiento
- [ ] Onboarding guiado (incluye "cómo instalar en iPhone")
