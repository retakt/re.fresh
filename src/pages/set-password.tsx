import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { BackButton } from '@/components/layout/back-button'
import AnimatedInput from '@/components/ui/animated-input'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Lock } from 'lucide-react'
import MagneticButton from '@/components/ui/smoothui/magnetic-button'
import { EncryptedText } from '@/components/ui/encrypted-text'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase exchanges the token from the URL hash automatically.
    // We just wait for the session to be established before showing the form.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true)
      } else {
        setError('This link is invalid or has already been used.')
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Min 6 characters, letters and numbers.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ 
      password,
      data: { password_set: true }
    })

    if (updateError) {
      // Replace Supabase's verbose password policy message with something short
      const msg = updateError.message.toLowerCase()
      if (msg.includes('character') || msg.includes('password') || msg.includes('weak')) {
        setError('Use letters and numbers, min 6 chars.')
      } else {
        setError(updateError.message)
      }
      setLoading(false)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-6 py-6">
      <div className="absolute left-4 top-4 sm:left-5 sm:top-5">
        <BackButton fallbackTo="/login" showLabel={false} className="px-2" />
      </div>

      <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-sky-400 dark:text-sky-300">
              <EncryptedText text="re" />
            </span>
            <span className="text-primary">
              <EncryptedText text="." />
            </span>
            <span className="text-foreground">
              <EncryptedText text="Takt" />
            </span>
          </h1>
          <p className="text-base text-muted-foreground">
            {ready ? 'choose a password to get started.' : 'verifying your link...'}
          </p>
        </div>

        {/* Spinner while exchanging token */}
        {!ready && !error && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {/* Invalid / expired link */}
        {error && !ready && (
          <div className="text-center space-y-4">
            <p className="text-sm text-red-500">{error}</p>
            <Link
              to="/login"
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              ← Back to login
            </Link>
          </div>
        )}

        {/* Password form */}
        {ready && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatedInput
              id="password"
              type="password"
              label="new password"
              value={password}
              onChange={setPassword}
              required
              disabled={loading}
              icon={<Lock size={18} />}
              inputClassName="h-10 text-base"
            />

            <AnimatedInput
              id="confirm"
              type="password"
              label="confirm password"
              value={confirm}
              onChange={setConfirm}
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
                {loading ? 'Saving...' : 'Set password'}
              </MagneticButton>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
