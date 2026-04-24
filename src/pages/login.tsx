import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { BackButton } from '@/components/layout/back-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const from = searchParams.get('from') ?? '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError('Invalid email/username or password')
      setLoading(false)
      return
    }

    navigate(from, { replace: true })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-6 py-6">
      <div className="absolute left-4 top-4 sm:left-5 sm:top-5">
        <BackButton fallbackTo={from === '/' ? '/' : from} showLabel={false} className="px-2" />
      </div>

      <div className="w-full max-w-xs space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-sky-400 dark:text-sky-300">re</span><span className="text-primary">.</span><span className="text-foreground">Takt</span>
          </h1>
          <p className="text-sm text-muted-foreground">an Isolated Space for you.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">email/username</Label>
            <Input
              id="email"
              type="text"
              placeholder=""
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm">password</Label>
            <Input
              id="password"
              type="password"
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="h-11"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground px-2">
          No public registration yet. Contact the site-owner...
        </p>
      </div>
    </div>
  )
}
