import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function LoginPage() {
  const { session, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/" replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    const res =
      mode === 'in' ? await signIn(email, password) : await signUp(email, password, name || undefined)
    setLoading(false)
    if (res.error) {
      setError(translateError(res.error))
    } else if (mode === 'up') {
      setInfo('Cuenta creada. Si pide confirmar correo, revísalo; si no, ya puedes entrar.')
      setMode('in')
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 pt-safe pb-safe">
      <div className="text-center">
        <img src="/logo.svg" alt="LifeOS" className="mx-auto h-16 w-16 rounded-2xl" />
        <h1 className="mt-4 text-3xl font-bold">LifeOS</h1>
        <p className="mt-1 text-sm text-muted">
          {mode === 'in' ? 'Bienvenido de vuelta.' : 'Crea tu cuenta para empezar.'}
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {mode === 'up' && (
          <Input
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        )}
        <Input
          type="email"
          inputMode="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
          required
          minLength={6}
        />

        {error && <p className="text-sm text-danger">{error}</p>}
        {info && <p className="text-sm text-success">{info}</p>}

        <Button type="submit" fullWidth disabled={loading} className="mt-2">
          {loading ? 'Un momento…' : mode === 'in' ? 'Entrar' : 'Crear cuenta'}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === 'in' ? 'up' : 'in'))
          setError(null)
          setInfo(null)
        }}
        className="text-center text-sm text-muted"
      >
        {mode === 'in' ? (
          <>¿No tienes cuenta? <span className="text-brand">Regístrate</span></>
        ) : (
          <>¿Ya tienes cuenta? <span className="text-brand">Inicia sesión</span></>
        )}
      </button>
    </div>
  )
}

function translateError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'Correo o contraseña incorrectos.'
  if (m.includes('already registered')) return 'Ese correo ya está registrado.'
  if (m.includes('password')) return 'La contraseña debe tener al menos 6 caracteres.'
  return msg
}
