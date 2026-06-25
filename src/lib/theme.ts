import { create } from 'zustand'

export type ThemeChoice = 'light' | 'dark' | 'system'

const KEY = 'lifeos-theme'

const systemDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
const resolveDark = (choice: ThemeChoice) => (choice === 'system' ? systemDark() : choice === 'dark')

/** Aplica el tema al <html> y actualiza el color de la barra de estado. */
function apply(choice: ThemeChoice) {
  const dark = resolveDark(choice)
  const root = document.documentElement
  root.classList.toggle('dark', dark)
  root.style.colorScheme = dark ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0E1124' : '#F5F7FE')
}

const initial = ((): ThemeChoice => {
  const stored = (typeof localStorage !== 'undefined' && localStorage.getItem(KEY)) as ThemeChoice | null
  return stored ?? 'light'
})()

interface ThemeState {
  choice: ThemeChoice
  setChoice: (choice: ThemeChoice) => void
}

export const useTheme = create<ThemeState>((set) => ({
  choice: initial,
  setChoice: (choice) => {
    try {
      localStorage.setItem(KEY, choice)
    } catch {
      /* almacenamiento no disponible */
    }
    apply(choice)
    set({ choice })
  },
}))

// Si el usuario eligió "sistema", reacciona a los cambios del sistema operativo.
if (typeof window !== 'undefined') {
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if (useTheme.getState().choice === 'system') apply('system')
  })
}
