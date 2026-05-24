import { motion } from 'framer-motion'
import { Search, Bell } from 'lucide-react'

export default function TopBar({ currentView, onNavigate }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-black/60 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <motion.button
          onClick={() => onNavigate('feed')}
          className="flex items-center gap-2.5 active:scale-95 transition-transform"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="drop-shadow-lg">
            <defs>
              <radialGradient id="nucleusGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="nucleusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6ee7b7" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
            <ellipse cx="18" cy="18" rx="15" ry="5.5" stroke="url(#orbitGrad)" strokeWidth="1.2" fill="none" opacity="0.7" />
            <ellipse cx="18" cy="18" rx="15" ry="5.5" stroke="url(#orbitGrad)" strokeWidth="1.2" fill="none" transform="rotate(60 18 18)" opacity="0.7" />
            <ellipse cx="18" cy="18" rx="15" ry="5.5" stroke="url(#orbitGrad)" strokeWidth="1.2" fill="none" transform="rotate(-60 18 18)" opacity="0.7" />
            <circle cx="33" cy="18" r="2" fill="#6ee7b7" opacity="0.9">
              <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="10.5" cy="5.2" r="1.8" fill="#2dd4bf" opacity="0.8">
              <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="-360 18 18" dur="5s" repeatCount="indefinite" />
            </circle>
            <circle cx="10.5" cy="30.8" r="1.5" fill="#22d3ee" opacity="0.7">
              <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="6s" repeatCount="indefinite" />
            </circle>
            <circle cx="18" cy="18" r="6" fill="url(#nucleusGlow)" />
            <circle cx="18" cy="18" r="3.5" fill="url(#nucleusGrad)" />
            <circle cx="17" cy="16.5" r="1" fill="white" opacity="0.4" />
          </svg>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-white leading-none">ATOM</span>
            <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-emerald-400/70 leading-none mt-0.5">Learn</span>
          </div>
        </motion.button>

        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/50 transition-all hover:bg-white/[0.1] hover:text-white active:scale-90">
            <Search className="h-4 w-4" />
          </button>
          <button className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/50 transition-all hover:bg-white/[0.1] hover:text-white active:scale-90">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-black" />
          </button>
          <button
            onClick={() => onNavigate('auth')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 ring-2 ring-white/10 transition-all hover:ring-emerald-400/40 active:scale-90"
          >
            <span className="text-xs font-bold text-white">A</span>
          </button>
        </motion.div>
      </div>
    </header>
  )
}
