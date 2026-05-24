import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase, supabaseEnabled } from '../lib/supabase'

export default function TopBar() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!supabaseEnabled) {
      setLoading(false)
      return
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    navigate('/login')
  }

  const routeName = location.pathname === '/upload' ? 'Upload' : location.pathname === '/login' ? 'Sign in' : 'Feed'

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur px-4 py-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div>
          <Link to="/" className="text-xl font-semibold tracking-tight text-white hover:text-indigo-300">
            Atom
          </Link>
          <p className="text-xs text-slate-400 mt-0.5">Learn with bite-sized video quizzes</p>
        </div>

        <div className="hidden md:flex items-center gap-3 text-slate-400 text-sm">
          <span className="rounded-full bg-slate-900 px-3 py-1">{routeName}</span>
          <Link
            to="/"
            className={`rounded-full px-3 py-1 transition ${location.pathname === '/' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            Feed
          </Link>
          <Link
            to="/upload"
            className={`rounded-full px-3 py-1 transition ${location.pathname === '/upload' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            Upload
          </Link>
          <Link
            to="/login"
            className={`rounded-full px-3 py-1 transition ${location.pathname === '/login' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            Account
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-slate-500 text-sm">Loading...</span>
          ) : supabaseEnabled && user ? (
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-sm text-slate-200">{user.email || 'Signed in'}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-slate-800 px-3 py-1 text-sm text-white hover:bg-slate-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-500"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
