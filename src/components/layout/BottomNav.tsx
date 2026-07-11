import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { Home, CheckSquare, LayoutGrid, Plus, Compass } from 'lucide-react'

const left = [
  { to: '/', label: 'Hoy', icon: Home, end: true },
  { to: '/tareas', label: 'Tareas', icon: CheckSquare, end: false },
]
const right = [
  { to: '/areas', label: 'Áreas', icon: Compass, end: false },
  { to: '/mas', label: 'Más', icon: LayoutGrid, end: false },
]

function NavItem({ to, label, icon: Icon, end }: (typeof left)[number]) {
  return (
    <li className="flex-1">
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
  )
}

export function BottomNav({ onCapture }: { onCapture: () => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border bg-surface/90 backdrop-blur">
      <ul className="flex items-stretch justify-around pb-safe">
        {left.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
        {/* FAB central: captura rápida global */}
        <li className="flex flex-1 items-center justify-center">
          <button
            onClick={onCapture}
            aria-label="Captura rápida"
            className="-mt-5 grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-card transition active:scale-90"
          >
            <Plus className="h-7 w-7" strokeWidth={2.5} />
          </button>
        </li>
        {right.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </ul>
    </nav>
  )
}
