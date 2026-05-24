import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Navigation() {
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 py-3 px-6 z-50">
      <div className="flex justify-around max-w-md mx-auto">
        <Link to="/" className={`flex flex-col items-center ${location.pathname === '/' ? 'text-indigo-400' : 'text-gray-500'}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.25L2.25 9L12 15.75L21.75 9L12 2.25Z" />
          </svg>
          <span className="text-xs mt-1">Feed</span>
        </Link>
        
        <Link to="/upload" className={`flex flex-col items-center ${location.pathname === '/upload' ? 'text-indigo-400' : 'text-gray-500'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs mt-1">Upload</span>
        </Link>
        
        <button onClick={handleLogout} className="flex flex-col items-center text-gray-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-xs mt-1">Logout</span>
        </button>
      </div>
    </nav>
  )
}