/**
 * Offline quiz when the generate-quiz edge function is unavailable.
 */
export function buildFallbackQuiz(title, description) {
  const topic = title?.trim() || 'this topic'
  const desc = description?.trim() || 'the video content'

  return {
    questions: [
      {
        question: `What is the main subject of "${topic}"?`,
        options: [topic, 'Random trivia', 'Unrelated topic', 'None of the above'],
        correctIndex: 0,
        explanation: `The video title tells us the focus is "${topic}".`,
      },
      {
        question: 'Which best describes this video?',
        options: [
          'Educational content',
          'A music video',
          'A sports highlight',
          'A cooking show only',
        ],
        correctIndex: 0,
        explanation: 'Atom is for educational short-form videos.',
      },
      {
        question: `Based on the description, what might you learn?`,
        options: [
          desc.slice(0, 60) || 'Something from the video',
          'Only entertainment with no learning',
          'Nothing — there is no description',
          'Only how to play games',
        ],
        correctIndex: 0,
        explanation: desc ? `Description: ${desc}` : 'Check the video description for context.',
      },
      {
        question: `Why take a quiz after watching "${topic}"?`,
        options: [
          'To reinforce what you learned',
          'To skip learning entirely',
          'Quizzes are never useful',
          'Only to waste time',
        ],
        correctIndex: 0,
        explanation: 'Short quizzes help memory and understanding stick.',
      },
    ],
  }
}
