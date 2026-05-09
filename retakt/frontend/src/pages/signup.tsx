import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BackButton } from '@/components/layout/back-button'
import { Button } from '@/components/ui/button'
import AnimatedInput from '@/components/ui/animated-input'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Mail, User, MessageSquare } from 'lucide-react'
import MagneticButton from '@/components/ui/smoothui/magnetic-button'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background px-6 py-6">
        <div className="absolute left-4 top-4 sm:left-5 sm:top-5">
          <BackButton fallbackTo="/" showLabel={false} className="px-2" />
        </div>

        <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="text-sky-400 dark:text-sky-300">re</span><span className="text-primary">.</span><span className="text-foreground">Takt</span>
            </h1>
            <p className="text-base text-muted-foreground">Request Submitted</p>
          </div>

          <div className="space-y-4 p-6 rounded-lg border bg-card/50">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Thanks for your interest!</h2>
              <p className="text-base text-muted-foreground">
                Your access request has been submitted. The site owner will review your request and contact you at <strong>{email}</strong> if approved.
              </p>
            </div>
          </div>

          <Link 
            to="/login" 
            className="inline-flex items-center text-base text-primary hover:text-primary/80 transition-colors"
          >
            ← Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-6 py-6">
      <div className="absolute left-4 top-4 sm:left-5 sm:top-5">
        <BackButton fallbackTo="/login" showLabel={false} className="px-2" />
      </div>

      <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-sky-400 dark:text-sky-300">re</span><span className="text-primary">.</span><span className="text-foreground">Takt</span>
          </h1>
          <p className="text-base text-muted-foreground">Request Access</p>
        </div>

        <div className="space-y-4 p-6 rounded-lg border bg-card/30">
          <p className="text-base text-muted-foreground text-center">
            Registration is currently by invitation only. Fill out this form to request access.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatedInput
            id="email"
            type="email"
            label="email address"
            value={email}
            onChange={setEmail}
            required
            disabled={loading}
            icon={<Mail size={18} />}
            inputClassName="h-10 text-base"
            placeholder="your@email.com"
          />

          <AnimatedInput
            id="username"
            type="text"
            label="preferred username"
            value={username}
            onChange={setUsername}
            required
            disabled={loading}
            icon={<User size={18} />}
            inputClassName="h-10 text-base"
            placeholder="username"
          />

          <div className="space-y-3">
            <label htmlFor="message" className="text-base font-medium text-foreground">
              Why do you want to join? (optional)
            </label>
            <div className="relative">
              <MessageSquare size={18} className="absolute top-3 left-3 text-muted-foreground z-10" />
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                className="w-full rounded-md border border-border bg-background px-3 py-3 pl-11 text-base text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 focus-visible:border-[var(--neon-lime)] focus-visible:ring-0 focus-visible:shadow-[0_0_8px_rgba(55,235,243,0.15),0_0_20px_rgba(55,235,243,0.08)] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                rows={3}
                placeholder="Tell us a bit about yourself..."
              />
            </div>
          </div>

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
              {loading ? 'Submitting request...' : 'Request Access'}
            </MagneticButton>
          </div>
        </form>

        <div className="text-center">
          <Link 
            to="/login" 
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}