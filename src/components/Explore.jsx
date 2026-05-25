import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'
import { Compass, Flame, Filter } from 'lucide-react'

const categories = [
  { name: 'AI & ML', icon: '🧠', color: 'from-emerald-500/20 to-teal-500/10' },
  { name: 'Physics', icon: '⚛️', color: 'from-violet-500/20 to-purple-500/10' },
  { name: 'Code', icon: '💻', color: 'from-orange-500/20 to-amber-500/10' },
  { name: 'Space', icon: '🌌', color: 'from-sky-500/20 to-cyan-500/10' },
  { name: 'Systems', icon: '🏗️', color: 'from-rose-500/20 to-pink-500/10' },
  { name: 'Math', icon: '📐', color: 'from-yellow-500/20 to-lime-500/10' },
]

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('videos')
        .select('*')
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .eq('status', 'ready')
        .limit(20)
      setSearchResults(data ?? [])
      setSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <div className="min-h-screen bg-black px-4 pb-28 pt-6 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <Compass className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Explore</h1>
                <p className="text-sm text-white/40">Discover new topics</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
            <svg className="h-4 w-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search topics, creators, videos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-white/50 uppercase tracking-wider">Categories</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {categories.map((cat, i) => (
              <motion.button key={cat.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * i }} whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-1.5 rounded-2xl bg-gradient-to-b ${cat.color} border border-white/[0.06] px-2 py-3 hover:border-white/[0.12] active:scale-95`}>
                <span className="text-xl">{cat.icon}</span>
                <span className="text-[10px] font-medium text-white/60">{cat.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Trending Now</h2>
          </div>
          <p className="text-sm text-white/30 text-center py-8">Trending videos will appear here when Supabase is connected.</p>
        </motion.div>
      </div>
    </div>
  )
}