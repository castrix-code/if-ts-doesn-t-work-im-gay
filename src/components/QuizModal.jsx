import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { invokeFunction } from '../lib/invokeFunction'
import { buildFallbackQuiz } from '../lib/fallbackQuiz'

export default function QuizModal({ video, onClose }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [usedFallback, setUsedFallback] = useState(false)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [answers, setAnswers] = useState([])
  const [finished, setFinished] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    loadQuiz()
  }, [video.id])

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

  if (loading) {
    return (
      <ModalShell onClose={onClose}>
        <div className="flex flex-col items-center py-12">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 mt-4">Generating quiz with AI...</p>
        </div>
      </ModalShell>
    )
  }

  if (error) {
    return (
      <ModalShell onClose={onClose}>
        <p className="text-red-400 mb-2 text-sm">{error}</p>
        <p className="text-gray-500 text-xs mb-4">
          Deploy <code className="text-gray-400">generate-quiz</code> and set{' '}
          <code className="text-gray-400">GEMINI_API_KEY</code> in Supabase secrets, or use the offline quiz.
        </p>
        <button
          type="button"
          onClick={() => loadQuiz(true)}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg mb-2"
        >
          Use offline quiz
        </button>
        <button
          type="button"
          onClick={() => loadQuiz(false)}
          className="w-full bg-gray-800 text-white py-3 rounded-lg"
        >
          Retry AI quiz
        </button>
      </ModalShell>
    )
  }

  if (finished) {
    return (
      <ModalShell onClose={onClose}>
        <h2 className="text-2xl font-bold text-white mb-2">Quiz complete</h2>
        <p className="text-indigo-400 text-lg mb-6">
          Score: {score} / {questions.length}
        </p>
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {questions.map((q, i) => {
            const answer = answers[i]
            return (
              <div
                key={q.question}
                className={`p-3 rounded-lg border ${
                  answer?.isCorrect
                    ? 'border-green-500/50 bg-green-500/10'
                    : 'border-red-500/50 bg-red-500/10'
                }`}
              >
                <p className="text-white text-sm font-medium">{q.question}</p>
                <p className="text-gray-400 text-xs mt-1">
                  Correct: {q.options[q.correctIndex]}
                </p>
                <p className="text-gray-300 text-xs mt-2">{q.explanation}</p>
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg"
        >
          Continue watching
        </button>
      </ModalShell>
    )
  }

  return (
    <ModalShell onClose={onClose}>
      {usedFallback && (
        <p className="text-amber-400/90 text-xs mb-3">Offline quiz (AI unavailable)</p>
      )}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Quick quiz</h2>
        <span className="text-gray-500 text-sm">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      <p className="text-white mb-4">{currentQuestion?.question}</p>

      <div className="space-y-2">
        {currentQuestion?.options.map((option, index) => {
          let style = 'bg-gray-800 hover:bg-gray-700 border-gray-700'
          if (selectedIndex !== null) {
            if (index === currentQuestion.correctIndex) {
              style = 'bg-green-500/20 border-green-500'
            } else if (index === selectedIndex) {
              style = 'bg-red-500/20 border-red-500'
            }
          }

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(index)}
              disabled={selectedIndex !== null}
              className={`w-full text-left px-4 py-3 rounded-lg border text-white transition ${style}`}
            >
              {option}
            </button>
          )
        })}
      </div>

      {selectedIndex !== null && (
        <p className="text-gray-400 text-sm mt-3">{currentQuestion.explanation}</p>
      )}

      <button
        type="button"
        onClick={handleNext}
        disabled={selectedIndex === null}
        className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
      >
        {currentIndex < questions.length - 1 ? 'Next question' : 'See results'}
      </button>
    </ModalShell>
  )
}

function ModalShell({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        aria-label="Close quiz"
      />
      <div className="relative bg-gray-900 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto border border-gray-800">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}
