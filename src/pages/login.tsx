import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { BackButton } from '@/components/layout/back-button'
import { Button } from '@/components/ui/button'
import AnimatedInput from '@/components/ui/animated-input'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Mail, Lock } from 'lucide-react'
import MagneticButton from '@/components/ui/smoothui/magnetic-button'

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

      <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-sky-400 dark:text-sky-300">re</span><span className="text-primary">.</span><span className="text-foreground">Takt</span>
          </h1>
          <p className="text-base text-muted-foreground">an Isolated Space for you.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatedInput
            id="email"
            type="text"
            label="email/username"
            value={email}
            onChange={setEmail}
            required
            disabled={loading}
            icon={<Mail size={18} />}
            inputClassName="h-10 text-base"
          />

          <AnimatedInput
            id="password"
            type="password"
            label="password"
            value={password}
            onChange={setPassword}
            required
            disabled={loading}
            icon={<Lock size={18} />}
            inputClassName="h-10 text-base"
          />

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <div className="flex justify-end">
            <MagneticButton 
              type="submit" 
              variant="default"
              size="sm"
              className="h-10 text-base px-8" 
              disabled={loading}
              strength={0.2}
              radius={200}
              springConfig={{ duration: 0.6, bounce: 0.1 }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </MagneticButton>
          </div>
        </form>

        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground px-2">
            No public registration yet. Contact the site-owner...
          </p>
          <Link 
            to="/signup" 
            className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
          >
            Request access →
          </Link>
        </div>
      </div>
    </div>
  )
}
