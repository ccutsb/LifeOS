import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'
export interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastState {
  toasts: Toast[]
  show: (message: string, type?: ToastType) => void
  dismiss: (id: number) => void
}

let counter = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (message, type = 'info') => {
    const id = ++counter
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2800)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Helper para usar fuera de componentes. */
export const toast = {
  success: (m: string) => useToastStore.getState().show(m, 'success'),
  error: (m: string) => useToastStore.getState().show(m, 'error'),
  info: (m: string) => useToastStore.getState().show(m, 'info'),
}
