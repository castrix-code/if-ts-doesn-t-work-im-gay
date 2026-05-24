import { motion } from 'framer-motion'
import { Home, Compass, Plus, BarChart3, User } from 'lucide-react'

export default function Navigation({ currentView, onNavigate }) {
  const items = [
    { key: 'feed', label: 'Home', icon: Home },
    { key: 'explore', label: 'Explore', icon: Compass },
    { key: 'upload', label: 'Upload', icon: Plus },
    { key: 'stats', label: 'Stats', icon: BarChart3 },
    { key: 'auth', label: 'Profile', icon: User },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.06] bg-black/80 backdrop-blur-2xl safe-area-bottom">
      <div className="mx-auto flex max-w-lg items-end justify-around px-2 py-1 sm:px-4 sm:py-2">
        {items.map((item) => {
          const isActive = currentView === item.key
          const isCenter = item.key === 'upload'
          const Icon = item.icon

          if (isCenter) {
            return (
              <button
                key={item.key}
                onClick={() => onNavigate('upload')}
                className="relative -mt-5 flex flex-col items-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 ring-4 ring-black">
                  <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />
                </div>
                <span className="mt-1 text-[10px] font-medium text-emerald-400">Upload</span>
              </button>
            )
          }

          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className="relative flex min-w-[48px] flex-col items-center gap-0.5 py-2"
            >
              {isActive && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute -top-1 h-1 w-1 rounded-full bg-emerald-400"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors">
                <Icon
                  className={`h-5 w-5 transition-colors ${isActive ? 'text-emerald-400' : 'text-white/35'}`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${isActive ? 'text-emerald-400' : 'text-white/35'}`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
