import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

function extractGeminiText(body: Record<string, unknown>): string {
  const candidates = body.candidates
  if (!Array.isArray(candidates) || candidates.length === 0) return ''

  const first = candidates[0]
  if (!first || typeof first !== 'object') return ''

  const content = (first as Record<string, unknown>).content
  if (!content || typeof content !== 'object') return ''

  const parts = (content as Record<string, unknown>).parts
  if (!Array.isArray(parts) || parts.length === 0) return ''

  const part = parts[0]
  if (!part || typeof part !== 'object') return ''

  return String((part as Record<string, unknown>).text ?? '')
}

const QUIZ_SCHEMA = `{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "explanation": "string"
    }
  ]
}`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401, req)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401, req)
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      return jsonResponse({ error: 'Gemini API key not configured' }, 500, req)
    }

    const { title, description, videoId } = await req.json()

    const prompt = `You are an educational quiz generator for the Atom learning app.
Create exactly 4 multiple-choice questions about this educational video.

Title: ${title || 'Educational video'}
Description: ${description || 'General educational content'}

Return ONLY valid JSON matching this schema (no markdown, no code fences):
 ${QUIZ_SCHEMA}

Rules:
- Questions must test understanding of the topic
- Each question has exactly 4 options
- correctIndex is 0-3
- Include a helpful explanation for each question`

    const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite']
    let geminiBody: Record<string, unknown> = {}
    let lastError = 'Failed to generate quiz from Gemini'

    for (const model of models) {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: 'application/json',
            },
          }),
        },
      )

      geminiBody = await geminiResponse.json()

      if (geminiResponse.ok) break

      const err = geminiBody.error
      if (err && typeof err === 'object' && 'message' in err) {
        lastError = String((err as Record<string, unknown>).message)
      } else {
        lastError = `Gemini ${model} failed`
      }
    }

    const rawText = extractGeminiText(geminiBody)

    if (!rawText) {
      return jsonResponse({ error: lastError }, 500, req)
    }

    let quiz
    try {
      quiz = JSON.parse(rawText)
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return jsonResponse({ error: 'Invalid quiz format from AI' }, 500, req)
      }
      quiz = JSON.parse(jsonMatch[0])
    }

    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      return jsonResponse({ error: 'Quiz had no questions' }, 500, req)
    }

    const questions = quiz.questions.slice(0, 5).map((q: Record<string, unknown>) => ({
      question: String(q.question ?? ''),
      options: Array.isArray(q.options) ? q.options.map(String).slice(0, 4) : [],
      correctIndex: Number(q.correctIndex ?? 0),
      explanation: String(q.explanation ?? ''),
    }))

    return jsonResponse({ videoId, questions }, 200, req)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse({ error: message }, 500, req)
  }
})
