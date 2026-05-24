import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload as UploadIcon, Film, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase, supabaseEnabled } from '../lib/supabase'
import { invokeFunction } from '../lib/invokeFunction'
import { uploadToMux } from '../lib/muxUpload'

export default function Upload({ onNavigate }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file')
      return
    }

    if (file.size > 500 * 1024 * 1024) {
      setError('Video must be under 500MB')
      return
    }

    setError('')
    setVideoFile(file)
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    setError('')

    if (!videoFile) {
      setError('Please select a video file')
      return
    }

    setUploading(true)
    setProgress(0)
    setStatusMessage('Creating upload...')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Please sign in to upload')
      }

      const data = await invokeFunction(supabase, 'mux-upload', {
        title,
        description,
      })

      const { uploadUrl } = data
      if (!uploadUrl) {
        throw new Error('No upload URL returned from server')
      }

      setStatusMessage('Uploading video to Mux...')
      await uploadToMux(uploadUrl, videoFile, setProgress)

      setProgress(100)
      setStatusMessage('Processing video — it will appear in the feed shortly.')

      setTimeout(() => onNavigate('feed'), 2000)
    } catch (err) {
      setError(err.message || 'Upload failed')
      setStatusMessage('')
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    if (!supabaseEnabled) return

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  if (!supabaseEnabled) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
            <Film className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Upload</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            The upload feature requires Supabase. Add your credentials to{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-emerald-400 text-xs">.env</code>{' '}
            and restart the server.
          </p>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
            <UploadIcon className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Upload a video</h2>
          <p className="text-sm text-white/50 mb-4">Please sign in to upload videos.</p>
          <button
            onClick={() => onNavigate('auth')}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 active:scale-95"
          >
            Sign in to continue
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-lg"
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Upload</h1>
          <p className="text-sm text-white/40 mt-1">Learn in atomic bytes</p>
        </div>

        <form onSubmit={handleUpload} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-white placeholder-white/20 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-emerald-500/30"
              placeholder="What's this video about?"
              required
              disabled={uploading}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-white placeholder-white/20 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-emerald-500/30 resize-none"
              rows={3}
              placeholder="Add a brief description..."
              disabled={uploading}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40">Video file</label>
            <label className="group flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-8 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/[0.03]">
              <Film className="h-5 w-5 text-white/30 transition-colors group-hover:text-emerald-400" />
              <span className="text-sm text-white/30 transition-colors group-hover:text-white/50">
                {videoFile ? videoFile.name : 'Click to select a video'}
              </span>
              <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" disabled={uploading} />
            </label>
            {videoFile && (
              <p className="mt-2 text-xs text-emerald-400/70">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB selected</p>
            )}
          </div>

          {uploading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                <span className="text-sm text-white/70">{statusMessage}</span>
                <span className="ml-auto text-sm font-mono text-emerald-400">{progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span className="text-sm text-red-300">{error}</span>
            </motion.div>
          )}

          {!uploading && statusMessage && !error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="text-sm text-emerald-300">{statusMessage}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload video'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
