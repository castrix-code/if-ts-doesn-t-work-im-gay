import { useState } from 'react'
import { supabase, supabaseEnabled } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    let result
    if (isLogin) {
      result = await supabase.auth.signInWithPassword({ email, password })
    } else {
      result = await supabase.auth.signUp({ email, password })
    }

    if (result.error) {
      alert(result.error.message)
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    if (!supabaseEnabled) {
      alert('Supabase is not configured. Copy .env.example to .env and add your Supabase keys.')
      return
    }

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-1">
          Atom
        </h1>
        <p className="text-indigo-400 text-center text-sm mb-8">Learn in atomic bytes</p>
        { !supabaseEnabled && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 rounded-lg p-3 mb-4 text-sm">
            Supabase is not configured, so login and signup are disabled. Copy <code className="bg-gray-900 px-1 rounded">.env.example</code> to <code className="bg-gray-900 px-1 rounded">.env</code> and add your Supabase keys.
          </div>
        ) }
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          
          <button
            type="submit"
            disabled={loading || !supabaseEnabled}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-500 transition disabled:opacity-50"
          >
            { !supabaseEnabled ? 'Supabase not configured' : loading ? 'Loading...' : (isLogin ? 'Login' : 'Sign Up') }
          </button>
        </form>

        <button
          onClick={handleGoogleLogin}
          className="w-full mt-4 bg-white text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
        >
          Continue with Google
        </button>

        <p className="text-center text-gray-400 mt-4">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-400 hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  )
}