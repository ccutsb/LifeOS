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

## 7. Notificaciones push reales en iPhone (Fase 4)

Requisitos: iOS **16.4+** y la PWA **instalada** en pantalla de inicio.

**a) Genera las claves VAPID** (una sola vez):
```bash
npx web-push generate-vapid-keys
```
- Copia la **pública** a `.env` → `VITE_VAPID_PUBLIC_KEY=...` (y a las env vars de Vercel). Vuelve a desplegar el front.
- Guarda la **privada** como secreto en Supabase (paso c).

**b) Carga la generación de recordatorios:** ejecuta `supabase/reminders.sql` en el SQL Editor.

**c) Despliega la Edge Function** (necesitas la [CLI de Supabase](https://supabase.com/docs/guides/cli)):
```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase secrets set VAPID_PUBLIC_KEY=xxx VAPID_PRIVATE_KEY=yyy
supabase functions deploy send-reminders
```
> `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya existen como secretos por defecto.

**d) Agenda el cron:** en el Dashboard → **Database → Extensions** habilita `pg_cron` y `pg_net`, y corre los dos `cron.schedule(...)` que están comentados al final de `supabase/reminders.sql` (reemplaza `<PROJECT_REF>` y `<SERVICE_ROLE_KEY>`).

**e) En la app:** instala la PWA en el iPhone (Safari → Compartir → Añadir a inicio), ábrela, ve a **Avisos** (campana del inicio) → **Activar avisos del sistema**. Acepta el permiso y listo.

> Sin completar esta fase, la app ya funciona con la **bandeja de avisos in-app** (alertas automáticas de vencidas, evaluaciones y clases).
