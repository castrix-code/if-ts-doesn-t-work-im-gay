import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, X, CheckCircle2, XCircle, Loader2, AlertCircle, WifiOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { invokeFunction } from '../lib/invokeFunction'
import { buildFallbackQuiz } from '../lib/fallbackQuiz'

export default function QuizModal({ video, onClose, onNavigate }) {
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState('')
  const [usedFallback, setUsedFallback] = useState(false)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [answers, setAnswers] = useState([])
  const [finished, setFinished] = useState(false)
  const [score, setScore] = useState(0)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setAuthLoading(false)
    }

    loadUser()
  }, [])

  useEffect(() => {
    if (authLoading) return

    if (user) {
      loadQuiz()
    } else {
      setLoading(false)
    }
  }, [video.id, user?.id, authLoading])

  const loadQuiz = async (useFallbackOnly = false) => {
    setLoading(true)
    setError('')
    setUsedFallback(false)

    if (useFallbackOnly) {
      setQuestions(buildFallbackQuiz(video.title, video.description).questions)
      setUsedFallback(true)
      setLoading(false)
      return
    }

    try {
      const data = await invokeFunction(supabase, 'generate-quiz', {
        videoId: video.id,
        title: video.title,
        description: video.description,
      })

      const qs = data.questions ?? []
      if (qs.length === 0) throw new Error('Quiz returned no questions')
      setQuestions(qs)
    } catch (err) {
      setError(err.message || 'Failed to generate quiz')
    } finally {
      setLoading(false)
    }
  }

  const currentQuestion = questions[currentIndex]

  const handleSelect = (optionIndex) => {
    if (selectedIndex !== null || finished) return
    setSelectedIndex(optionIndex)
  }

  const handleNext = async () => {
    const isCorrect = selectedIndex === currentQuestion.correctIndex
    const newAnswers = [
      ...answers,
      {
        questionIndex: currentIndex,
        selectedIndex,
        correctIndex: currentQuestion.correctIndex,
        isCorrect,
      },
    ]
    setAnswers(newAnswers)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1)
      setSelectedIndex(null)
      return
    }

    const finalScore = newAnswers.filter((a) => a.isCorrect).length
    setScore(finalScore)
    setFinished(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('quiz_results').insert({
        user_id: user.id,
        video_id: video.id,
        score: finalScore,
        total_questions: questions.length,
        answers: newAnswers.map((a, i) => ({
          question: questions[i].question,
          selectedIndex: a.selectedIndex,
          correctIndex: a.correctIndex,
          isCorrect: a.isCorrect,
          explanation: questions[i].explanation,
          fallback: usedFallback,
        })),
      })
    }
  }

  if (authLoading || loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-400" />
          <p className="mt-4 text-sm text-white/60">
            {authLoading ? 'Checking login...' : 'Generating quiz with AI...'}
          </p>
        </div>
      </motion.div>
    )
  }

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
            <Brain className="h-6 w-6 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Sign in to generate a quiz</h3>
          <p className="mt-2 text-sm text-white/50 leading-relaxed">
            The quiz generator requires an authenticated session. Please sign in, then try again.
          </p>
          <div className="mt-5 space-y-3">
            <button
              onClick={() => onNavigate('auth')}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25"
            >
              Go to login
            </button>
            <button
              onClick={() => loadQuiz(true)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 text-sm text-white/60 transition-all hover:bg-white/[0.08] hover:text-white"
            >
              Use offline quiz instead
            </button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
            <AlertCircle className="h-6 w-6 text-red-400" />
          </div>
          <p className="text-sm text-red-300 mb-2">{error}</p>
          <p className="text-xs text-white/40 leading-relaxed">
            Deploy generate-quiz and set <code className="rounded bg-white/10 px-1 py-0.5 text-emerald-400">GEMINI_API_KEY</code> in Supabase secrets, or use the offline quiz.
          </p>
          <div className="mt-5 space-y-3">
            <button
              onClick={() => loadQuiz(true)}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25"
            >
              Use offline quiz
            </button>
            <button
              onClick={() => loadQuiz(false)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 text-sm text-white/60 transition-all hover:bg-white/[0.08] hover:text-white"
            >
              Retry AI quiz
            </button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm max-h-[80vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6"
        >
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/10">
              <span className="text-2xl font-bold text-emerald-400">{pct}%</span>
            </div>
            <h3 className="text-xl font-bold text-white">Quiz complete</h3>
            <p className="mt-1 text-sm text-white/50">
              Score: <span className="text-emerald-400 font-semibold">{score}</span> / {questions.length}
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {questions.map((q, i) => {
              const answer = answers[i]
              return (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-sm text-white/80">{q.question}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {answer.isCorrect ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    )}
                    <span className="text-xs text-white/40">Correct: {q.options[q.correctIndex]}</span>
                  </div>
                  {q.explanation && (
                    <p className="mt-1.5 text-xs text-white/30 leading-relaxed">{q.explanation}</p>
                  )}
                </div>
              )
            })}
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25"
          >
            Continue watching
          </button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            {usedFallback && (
              <span className="mb-1 flex items-center gap-1 text-xs text-amber-400/70">
                <WifiOff className="h-3 w-3" /> Offline quiz
              </span>
            )}
            <h3 className="text-lg font-bold text-white">Quick quiz</h3>
            <p className="text-xs text-white/40">{currentIndex + 1} / {questions.length}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/40 transition-all hover:bg-white/[0.1] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <p className="text-white font-medium leading-relaxed mb-5">{currentQuestion.question}</p>

        <div className="space-y-2.5 mb-5">
          {currentQuestion.options.map((option, i) => {
            const isSelected = selectedIndex === i
            const isCorrect = i === currentQuestion.correctIndex
            const showResult = selectedIndex !== null

            let optionClass = 'border-white/[0.08] bg-white/[0.03] text-white/70'
            if (showResult && isCorrect) {
              optionClass = 'border-emerald-500/50 bg-emerald-500/[0.08] text-emerald-300'
            } else if (showResult && isSelected && !isCorrect) {
              optionClass = 'border-red-500/50 bg-red-500/[0.08] text-red-300'
            } else if (isSelected) {
              optionClass = 'border-emerald-500/50 bg-emerald-500/[0.08] text-white'
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={selectedIndex !== null}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-all ${optionClass} disabled:cursor-default`}
              >
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-current/30 text-[10px] font-bold">
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </button>
            )
          })}
        </div>

        {selectedIndex !== null && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleNext}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25"
          >
            {currentIndex < questions.length - 1 ? 'Next question' : 'See results'}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  )
}
