import { supabase } from '@/lib/supabase'
import { getUserId } from '@/lib/crud'
import { queryClient } from '@/lib/queryClient'
import { dateKey } from '@/lib/dates'

/**
 * Respaldo completo en JSON de todos los datos del usuario.
 * - Exportar: descarga un archivo con todas las tablas.
 * - Importar: restaura por upsert (mismo id = actualiza, nuevo = inserta).
 *   points_ledger NO se importa (su trigger volvería a sumar puntos);
 *   los puntos se restauran directo en el perfil.
 */

// Orden de importación = orden de dependencias (FK)
const IMPORT_ORDER = [
  'life_areas',
  'objectives',
  'semesters',
  'courses',
  'course_schedule',
  'evaluations',
  'tasks',
  'habits',
  'habit_logs',
  'routines',
  'routine_items',
  'routine_logs',
  'focus_sessions',
  'rewards',
  'transactions',
  'budgets',
  'savings_goals',
  'savings_rules',
  'events',
  'weekly_reviews',
] as const

// Exportamos además el historial de puntos (solo informativo al restaurar)
const EXPORT_TABLES = [...IMPORT_ORDER, 'points_ledger'] as const

interface BackupFile {
  app: 'lifeos'
  version: 2
  exported_at: string
  profile: Record<string, unknown> | null
  tables: Record<string, Record<string, unknown>[]>
}

/** Trae todas las filas de una tabla paginando (Supabase limita a 1000 por request). */
async function fetchAll(table: string): Promise<Record<string, unknown>[]> {
  const PAGE = 1000
  const rows: Record<string, unknown>[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + PAGE - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    rows.push(...((data ?? []) as Record<string, unknown>[]))
    if (!data || data.length < PAGE) break
  }
  return rows
}

export async function exportBackup(): Promise<void> {
  const uid = await getUserId()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()

  const tables: BackupFile['tables'] = {}
  for (const t of EXPORT_TABLES) {
    tables[t] = await fetchAll(t)
  }

  const payload: BackupFile = {
    app: 'lifeos',
    version: 2,
    exported_at: new Date().toISOString(),
    profile: (profile as Record<string, unknown>) ?? null,
    tables,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lifeos-respaldo-${dateKey()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export async function importBackup(file: File): Promise<{ restored: number; warnings: string[] }> {
  const text = await file.text()
  let data: BackupFile
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('El archivo no es un JSON válido')
  }
  if (data.app !== 'lifeos' || !data.tables) {
    throw new Error('Este archivo no parece un respaldo de LifeOS')
  }

  const uid = await getUserId()
  const warnings: string[] = []
  let restored = 0

  for (const table of IMPORT_ORDER) {
    const rows = data.tables[table]
    if (!rows || rows.length === 0) continue
    // Reasigna el dueño (permite restaurar en otra cuenta) y respeta RLS
    const owned = rows.map((r) => ({ ...r, user_id: uid }))
    for (const part of chunk(owned, 400)) {
      const { error } = await supabase.from(table).upsert(part, { onConflict: 'id' })
      if (error) {
        warnings.push(`${table}: ${error.message}`)
        break
      }
      restored += part.length
    }
  }

  // Restaura el perfil (incluye puntos, sin pasar por el ledger)
  if (data.profile) {
    const p = data.profile
    await supabase
      .from('profiles')
      .update({
        display_name: p.display_name ?? null,
        points: p.points ?? 0,
        life_mode: p.life_mode ?? 'semestre',
        settings: p.settings ?? {},
      })
      .eq('id', uid)
  }

  await queryClient.invalidateQueries()
  return { restored, warnings }
}
