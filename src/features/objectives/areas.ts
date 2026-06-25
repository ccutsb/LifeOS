import { GraduationCap, HeartPulse, Wallet, Briefcase, Sparkles, Users, Compass, type LucideIcon } from 'lucide-react'
import type { LifeGoalArea } from '@/types/database'

/** Áreas de vida: etiqueta, ícono y color por defecto. */
export const AREAS: Record<LifeGoalArea, { label: string; icon: LucideIcon; color: string }> = {
  academico: { label: 'Académico', icon: GraduationCap, color: '#6366f1' },
  salud: { label: 'Salud', icon: HeartPulse, color: '#22c55e' },
  finanzas: { label: 'Finanzas', icon: Wallet, color: '#f59e0b' },
  carrera: { label: 'Carrera', icon: Briefcase, color: '#06b6d4' },
  personal: { label: 'Personal', icon: Sparkles, color: '#a855f7' },
  social: { label: 'Social', icon: Users, color: '#ec4899' },
  otro: { label: 'Otro', icon: Compass, color: '#64748b' },
}

export const AREA_OPTIONS = (Object.keys(AREAS) as LifeGoalArea[]).map((a) => ({ value: a, label: AREAS[a].label }))

export const areaIcon = (area: LifeGoalArea): LucideIcon => AREAS[area]?.icon ?? Compass
