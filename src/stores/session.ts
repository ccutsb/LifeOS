import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Energy } from '@/types/database'

/**
 * Estado efímero de la sesión: cómo se siente el usuario AHORA.
 * Se persiste en localStorage (es un estado del momento y del dispositivo,
 * no tiene sentido sincronizarlo entre equipos) y expira a las 4 horas.
 */

const ENERGY_TTL_MS = 4 * 60 * 60 * 1000

interface SessionState {
  energy: Energy | null
  energySetAt: number | null
  availableMinutes: number
  setEnergy: (e: Energy | null) => void
  setAvailableMinutes: (m: number) => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      energy: null,
      energySetAt: null,
      availableMinutes: 45,
      setEnergy: (e) => set({ energy: e, energySetAt: e ? Date.now() : null }),
      setAvailableMinutes: (m) => set({ availableMinutes: m }),
    }),
    { name: 'lifeos-session' },
  ),
)

/** Energía vigente (null si nunca se marcó o si ya expiró). */
export function useCurrentEnergy(): Energy | null {
  const { energy, energySetAt } = useSessionStore()
  if (!energy || !energySetAt) return null
  return Date.now() - energySetAt < ENERGY_TTL_MS ? energy : null
}
