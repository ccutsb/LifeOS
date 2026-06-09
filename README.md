# LifeOS

Tu sistema de vida: **universidad, hábitos, finanzas y enfoque** — en una sola PWA instalable en el iPhone.

Diseñada para funcionar **aunque no tengas motivación**: mínima fricción, modo oscuro sin distractores y diseño conductual (Atomic Habits · GTD · Deep Work · Time Blocking · Eisenhower).

## Stack

- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS
- **Backend:** Supabase (Auth + PostgreSQL + RLS + Realtime + Edge Functions)
- **Datos/Cache:** TanStack Query con persistencia en `localStorage` (abre al instante, lee offline)
- **PWA:** vite-plugin-pwa (instalable, offline, íconos y splash de iOS)
- **Notificaciones:** locales/in-app + Web Push real (vía Edge Function)

## Puesta en marcha (local)

```bash
npm install
cp .env.example .env          # y rellena con tus claves de Supabase
npm run generate:pwa-assets   # genera íconos PWA desde public/logo.svg
npm run dev                   # http://localhost:5173
```

> Para configurar Supabase y desplegar, lee [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
> Para entender la estructura, lee [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
> Plan de trabajo por fases en [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (accesible desde tu iPhone en la misma red) |
| `npm run build` | Build de producción |
| `npm run preview` | Previsualiza el build |
| `npm run typecheck` | Verifica tipos con TypeScript |
| `npm run generate:pwa-assets` | Regenera íconos/splash desde `public/logo.svg` |
