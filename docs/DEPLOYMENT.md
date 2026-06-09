# Guía de despliegue — LifeOS

## 1. Crear el proyecto Supabase (gratis, sin tarjeta)

1. Entra a <https://supabase.com> → **Start your project** → inicia sesión con GitHub.
2. **New project**: nombre `lifeos`, elige una contraseña de base de datos (guárdala) y la región más cercana (ej. `South America (São Paulo)`).
3. Espera ~2 min a que se aprovisione.

> El plan **Free no pide tarjeta** y no puede cobrarte. Solo se factura si subes manualmente a Pro.
> Nota: un proyecto Free se **pausa tras 7 días sin actividad**; al usarlo a diario no se pausa, y si pasara, lo reactivas con 1 clic sin perder datos.

## 2. Cargar el esquema

1. En el Dashboard de Supabase → **SQL Editor** → **New query**.
2. Pega el contenido de [`supabase/schema.sql`](../supabase/schema.sql) y pulsa **Run**.
3. Verifica en **Table Editor** que aparezcan las tablas (`profiles`, `courses`, `tasks`, …).

## 3. Configurar Auth

1. **Authentication → Providers → Email**: déjalo habilitado.
2. Para uso personal sin fricción: **Authentication → Sign In / Up → "Confirm email"** → puedes **desactivarlo** para entrar de inmediato tras registrarte (es tu propia cuenta).

## 4. Conectar el frontend

1. **Project Settings → API**: copia `Project URL` y `anon public key`.
2. En el proyecto:
   ```bash
   cp .env.example .env
   ```
   y rellena:
   ```
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
3. `npm install && npm run dev` → entra, regístrate y prueba.

## 5. Desplegar (Vercel, gratis)

1. Sube el repo a GitHub.
2. <https://vercel.com> → **Add New Project** → importa el repo.
3. Framework: **Vite**. Build: `npm run build`. Output: `dist`.
4. **Environment Variables**: agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
5. **Deploy**. Te queda una URL `https://lifeos-xxxx.vercel.app`.

> Alternativa equivalente: **Netlify** o **Cloudflare Pages** (mismo proceso).

## 6. Instalar la PWA en el iPhone

1. Abre la URL de Vercel en **Safari** (debe ser Safari para instalar).
2. Toca **Compartir** (cuadro con flecha) → **Añadir a pantalla de inicio**.
3. Ábrela desde el ícono: se ve a pantalla completa, sin barra de Safari.

## 7. (Fase 4) Notificaciones push reales en iPhone

Requisitos: iOS **16.4+** y la PWA **instalada** en pantalla de inicio.

1. Genera las claves VAPID:
   ```bash
   npx web-push generate-vapid-keys
   ```
   Pon la pública en `.env` (`VITE_VAPID_PUBLIC_KEY`) y guarda la privada como secreto en Supabase.
2. Despliega la Edge Function `supabase/functions/send-reminders` y prográmala con un cron (Supabase **Database → Cron**) cada pocos minutos para enviar los recordatorios pendientes.
3. En la app, el usuario concede permiso de notificaciones (solo funciona con la PWA instalada en iOS).

> Esta fase se implementa al final; el MVP funciona perfecto con recordatorios locales/in-app.
