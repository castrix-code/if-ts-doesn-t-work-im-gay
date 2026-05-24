import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, supabaseEnabled } from '../lib/supabase'
import { invokeFunction } from '../lib/invokeFunction'
import { uploadToMux } from '../lib/muxUpload'

export default function Upload() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

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

      setTimeout(() => navigate('/'), 2000)
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
      <div className="min-h-screen bg-black pt-8 pb-24 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-4">Upload</h1>
          <div className="rounded-3xl border border-red-500/30 bg-red-500/5 p-6">
            <h2 className="text-xl font-semibold text-white mb-2">Supabase not configured</h2>
            <p className="text-gray-400 mb-4">
              The upload feature requires Supabase. Add your credentials to <code className="bg-slate-900 px-2 py-1 rounded">.env</code> and restart the server.
            </p>
            <p className="text-sm text-slate-400">Your upload form will become available once the app can connect to Supabase.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black pt-8 pb-24 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-4">Upload</h1>
          <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
            <p className="text-gray-300 mb-4">Please sign in to upload videos.</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Sign in to continue
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-8 pb-24 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-1">Upload</h1>
        <p className="text-indigo-400 text-sm mb-8">Learn in atomic bytes</p>

        <form onSubmit={handleUpload} className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Video file</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white"
              required
              disabled={uploading}
            />
            {videoFile && (
              <p className="text-gray-500 text-sm mt-2">
                {(videoFile.size / (1024 * 1024)).toFixed(1)} MB selected
              </p>
            )}
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>{statusMessage}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          {!uploading && statusMessage && !error && (
            <p className="text-indigo-300 text-sm">{statusMessage}</p>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-500 transition disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload video'}
          </button>
        </form>
      </div>
    </div>
  )
}
