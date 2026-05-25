import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, AlertCircle, LogOut, User as UserIcon, Video, Award } from 'lucide-react'
import { supabase, supabaseEnabled } from '../lib/supabase'

export default function Auth({ onNavigate }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [videoCount, setVideoCount] = useState(0)
  const [quizCount, setQuizCount] = useState(0)

  useEffect(() => {
    if (!supabaseEnabled) {
      setAuthLoading(false)
      return
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    supabase
      .from('videos')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setVideoCount(count ?? 0))
  }, [user])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    let result
    if (isLogin) {
      result = await supabase.auth.signInWithPassword({ email, password })
    } else {
      result = await supabase.auth.signUp({ email, password })
    }

    if (result.error) {
      setError(result.error.message)
    } else {
      onNavigate('feed')
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    if (!supabaseEnabled) {
      setError('Supabase is not configured. Copy .env.example to .env and add your Supabase keys.')
      return
    }

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  if (authLoading) {
    return (
      <div className="flex h-[calc(100vh-104px)] items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-8 w-8 rounded-full border-2 border-emerald-400/30 border-t-emerald-400"
        />
      </div>
    )
  }

  // ── Signed in → show profile ──
  if (user) {
    const initials = user.email ? user.email[0].toUpperCase() : 'A'
    const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'

    return (
      <div className="flex h-[calc(100vh-104px)] items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm text-center"
        >
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
            <span className="text-2xl font-bold text-white">{initials}</span>
          </div>

          <h2 className="text-xl font-bold text-white">{displayName}</h2>
          <p className="text-sm text-white/40 mt-1">{user.email}</p>

          <div className="mt-6 flex justify-center gap-6">
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06]">
                <Video className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="mt-1.5 text-lg font-bold text-white">{videoCount}</span>
              <span className="text-[10px] text-white/40">Videos</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06]">
                <Award className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="mt-1.5 text-lg font-bold text-white">{quizCount}</span>
              <span className="text-[10px] text-white/40">Quizzes</span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10 hover:border-red-500/20 active:scale-[0.98]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </motion.div>
      </div>
    )
  }

  // ── Not signed in → show login form ──
  return (
    <div className="flex h-[calc(100vh-104px)] items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
              <ellipse cx="18" cy="18" rx="14" ry="5" stroke="white" strokeWidth="1.5" fill="none" opacity="0.6" />
              <ellipse cx="18" cy="18" rx="14" ry="5" stroke="white" strokeWidth="1.5" fill="none" transform="rotate(60 18 18)" opacity="0.6" />
              <ellipse cx="18" cy="18" rx="14" ry="5" stroke="white" strokeWidth="1.5" fill="none" transform="rotate(-60 18 18)" opacity="0.6" />
              <circle cx="18" cy="18" r="4" fill="white" opacity="0.9" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Atom</h1>
          <p className="text-sm text-white/40 mt-1">Learn in atomic bytes</p>
        </div>

        {!supabaseEnabled && (
          <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
            <p className="text-xs text-amber-300 leading-relaxed">
              Supabase is not configured, so login and signup are disabled. Copy{' '}
              <code className="rounded bg-white/10 px-1 py-0.5">.env.example</code> to{' '}
              <code className="rounded bg-white/10 px-1 py-0.5">.env</code> and add your Supabase keys.
            </p>
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span className="text-sm text-red-300">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3.5 pl-11 pr-4 text-white placeholder-white/20 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-emerald-500/30"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3.5 pl-11 pr-11 text-white placeholder-white/20 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-emerald-500/30"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !supabaseEnabled}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!supabaseEnabled ? 'Supabase not configured' : loading ? 'Loading...' : isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-xs text-white/20">or</span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={!supabaseEnabled}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3.5 text-sm font-medium text-white/70 transition-all hover:bg-white/[0.08] hover:text-white active:scale-[0.98] disabled:opacity-50"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </span>
        </button>

        <p className="mt-6 text-center text-sm text-white/30">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setIsLogin(!isLogin); setError('') }}
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            {isLogin ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
