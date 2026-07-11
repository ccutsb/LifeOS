import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { getUserId } from '@/lib/crud'
import { qk } from '@/lib/queryKeys'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { useAreas } from './hooks'

// Mismo set que seed_default_areas() en migration-v2.sql
const DEFAULT_AREAS = [
  { name: 'Universidad', icon: '🎓', color: '#6366f1', kind: 'university', sort_order: 1 },
  { name: 'Trabajo', icon: '💼', color: '#06b6d4', kind: 'work', sort_order: 2 },
  { name: 'Hogar', icon: '🏠', color: '#f59e0b', kind: 'home', sort_order: 3 },
  { name: 'Salud', icon: '❤️', color: '#ef4444', kind: 'health', sort_order: 4 },
  { name: 'Finanzas', icon: '💰', color: '#22c55e', kind: 'finance', sort_order: 5 },
  { name: 'Desarrollo personal', icon: '📖', color: '#a855f7', kind: 'growth', sort_order: 6 },
  { name: 'Proyectos', icon: '💻', color: '#ec4899', kind: 'projects', sort_order: 7 },
  { name: 'Ocio', icon: '🎮', color: '#64748b', kind: 'leisure', sort_order: 8 },
]

/**
 * Tarjeta de onboarding: aparece solo cuando el usuario no tiene áreas
 * (cuenta creada antes de la migración v2, o semilla que falló).
 */
export function SeedAreasCard() {
  const { data: areas = [], isLoading, isError } = useAreas()
  const qc = useQueryClient()

  const seed = useMutation({
    mutationFn: async () => {
      const user_id = await getUserId()
      const { error } = await supabase
        .from('life_areas')
        .insert(DEFAULT_AREAS.map((a) => ({ ...a, user_id })))
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.areas })
      toast.success('¡Áreas creadas! Tu vida completa, organizada.')
    },
    onError: (e) => {
      const msg = errorMessage(e)
      toast.error(
        msg.includes('does not exist') || msg.includes('schema cache')
          ? 'Falta correr supabase/migration-v2.sql en Supabase'
          : msg,
      )
    },
  })

  if (isLoading || isError || areas.length > 0) return null

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand/40 bg-brand/10 p-5 text-center">
      <Compass className="h-8 w-8 text-brand" />
      <div>
        <p className="font-semibold">Configura tus áreas de vida</p>
        <p className="mt-1 text-sm text-muted">
          Universidad, Hogar, Salud, Proyectos… para que cada tarea tenga contexto.
        </p>
      </div>
      <Button onClick={() => seed.mutate()} disabled={seed.isPending}>
        {seed.isPending ? 'Creando…' : 'Crear mis 8 áreas'}
      </Button>
    </div>
  )
}
