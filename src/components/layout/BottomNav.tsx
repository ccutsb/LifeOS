import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { Home, GraduationCap, CheckSquare, Flame, LayoutGrid } from 'lucide-react'

const items = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/universidad', label: 'Ramos', icon: GraduationCap, end: false },
  { to: '/tareas', label: 'Tareas', icon: CheckSquare, end: false },
  { to: '/habitos', label: 'Hábitos', icon: Flame, end: false },
  { to: '/mas', label: 'Más', icon: LayoutGrid, end: false },
]

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border bg-surface/90 backdrop-blur">
      <ul className="flex items-stretch justify-around pb-safe">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition',
                  isActive ? 'text-brand' : 'text-muted',
                )
              }
            >
              <Icon className="h-6 w-6" strokeWidth={2} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
