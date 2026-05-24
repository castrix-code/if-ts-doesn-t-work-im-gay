import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey)

let supabase

if (!supabaseEnabled) {
  // Provide a safe fallback so the app doesn't crash during module initialization.
  // This allows the UI to load; Supabase features will be no-ops with friendly errors.
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Supabase features disabled.')

  // Minimal chainable query builder for `from(...).select(...).order(...)` calls
  const makeQuery = () => {
    return {
      select() {
        return {
          order: async () => ({ data: [], error: null }),
        }
      },
      insert: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      update: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      delete: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    }
  }

  const makeChannel = () => {
    const channel = {
      _handlers: [],
      on(event, filter, callback) {
        this._handlers.push({ event, filter, callback })
        return this
      },
      subscribe() {
        return this
      },
      unsubscribe() {},
    }
    return channel
  }

  supabase = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ error: { message: 'Supabase not configured' } }),
      signUp: async () => ({ error: { message: 'Supabase not configured' } }),
      getSession: async () => ({ data: { session: null } }),
      signOut: async () => ({ error: null }),
    },
    from: () => makeQuery(),
    channel: () => makeChannel(),
    removeChannel: () => {},
    storage: { from: () => ({ upload: async () => ({ error: { message: 'Supabase not configured' } }) }) },
  }
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }