/**
 * Invoke a Supabase edge function and surface the real error body (not just "non-2xx").
 */
export async function invokeFunction(supabase, name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body })

  if (error) {
    let message = error.message || 'Function call failed'

    if (error.context) {
      try {
        const details = await error.context.json()
        message = details?.error || details?.message || message
      } catch {
        try {
          const text = await error.context.text()
          if (text) message = text
        } catch {
          // ignore
        }
      }
    }

    throw new Error(message)
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data
}
