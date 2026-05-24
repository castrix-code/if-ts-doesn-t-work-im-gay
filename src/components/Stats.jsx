import { motion } from 'framer-motion'
import { BarChart3, Trophy, Flame, Target, BookOpen, TrendingUp, Award } from 'lucide-react'

const achievements = [
  { icon: Trophy, label: 'First Quiz', desc: 'Complete your first quiz', unlocked: true },
  { icon: Flame, label: '5-Day Streak', desc: 'Watch videos 5 days in a row', unlocked: true },
  { icon: Target, label: 'Sharpshooter', desc: 'Score 100% on 3 quizzes', unlocked: false },
  { icon: BookOpen, label: 'Bookworm', desc: 'Watch 50 videos', unlocked: false },
  { icon: Award, label: 'Scholar', desc: 'Explore all categories', unlocked: false },
  { icon: TrendingUp, label: 'Rising Star', desc: '10-day streak', unlocked: false },
]

export default function Stats() {
  return (
    <div className="min-h-screen bg-black px-4 pb-28 pt-6 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Your Progress</h1>
              <p className="text-sm text-white/40">Track your learning journey</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="mb-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
          <p className="text-white/30 text-sm">Your stats will appear here once you start watching videos and taking quizzes.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="mb-3 text-sm font-semibold text-white/50 uppercase tracking-wider">Achievements</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {achievements.map((ach, i) => {
              const Icon = ach.icon
              return (
                <motion.div key={ach.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * i }}
                  className={`flex flex-col items-center rounded-2xl border p-4 text-center ${ach.unlocked ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/[0.04] bg-white/[0.01] opacity-40'}`}>
                  <Icon className={`h-6 w-6 mb-2 ${ach.unlocked ? 'text-emerald-400' : 'text-white/20'}`} />
                  <span className="text-xs font-semibold text-white/70">{ach.label}</span>
                  <span className="mt-0.5 text-[10px] text-white/30">{ach.desc}</span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
