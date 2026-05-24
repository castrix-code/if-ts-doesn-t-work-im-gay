import { useCallback, useEffect, useRef, useState } from 'react'
import MuxPlayer from '@mux/mux-player-react'
import { Brain, Trash2, Volume2, VolumeX, Heart, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, supabaseEnabled } from '../lib/supabase'
import QuizModal from './QuizModal'

export default function VideoFeed({ onNavigate }) {
  if (!supabaseEnabled) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
            <Brain className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Supabase not configured</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            The video feed and account system are disabled until you add your Supabase keys to{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-emerald-400 text-xs">.env</code>.
          </p>
          <p className="mt-3 text-xs text-white/30">
            Copy <code className="rounded bg-white/10 px-1 py-0.5 text-white/50">.env.example</code> to{' '}
            <code className="rounded bg-white/10 px-1 py-0.5 text-white/50">.env</code>, set{' '}
            <code className="rounded bg-white/10 px-1 py-0.5 text-emerald-400">VITE_SUPABASE_URL</code> and{' '}
            <code className="rounded bg-white/10 px-1 py-0.5 text-emerald-400">VITE_SUPABASE_ANON_KEY</code>, then restart.
          </p>
        </motion.div>
      </div>
    )
  }

  const [videos, setVideos] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [quizVideo, setQuizVideo] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchVideos = useCallback(async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching videos:', error)
    } else {
      const playable = (data ?? []).filter(
        (v) =>
          v.mux_playback_id &&
          v.mux_playback_id !== 'placeholder' &&
          v.status !== 'error' &&
          (!v.status || v.status === 'ready'),
      )
      setVideos(playable)
    }
    setLoading(false)
  }, [])

  const removeVideo = useCallback((videoId) => {
    setVideos((prev) => prev.filter((v) => v.id !== videoId))
    setCurrentIndex(0)
    if (quizVideo?.id === videoId) setQuizVideo(null)
  }, [quizVideo?.id])

  const refreshVideos = useCallback(() => {
    fetchVideos()
  }, [fetchVideos])

  useEffect(() => {
    fetchVideos()

    const channel = supabase
      .channel('videos-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'videos' },
        () => fetchVideos(),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'videos' },
        () => fetchVideos(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchVideos])

  const handleScroll = (e) => {
    const index = Math.round(e.target.scrollTop / window.innerHeight)
    setCurrentIndex(index)
  }

  return (
    <>
      <div className="h-screen overflow-y-scroll snap-y snap-mandatory pb-16" onScroll={handleScroll}>
        {loading && (
          <div className="flex h-screen items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-8 w-8 rounded-full border-2 border-emerald-400/30 border-t-emerald-400"
            />
          </div>
        )}

        {!loading &&
          videos.map((video, index) => (
            <VideoCard
              key={video.id}
              video={video}
              isActive={index === currentIndex}
              onVideoEnded={() => setQuizVideo(video)}
              onStartQuiz={() => setQuizVideo(video)}
              onRemove={removeVideo}
              onRefresh={refreshVideos}
            />
          ))}

        {!loading && videos.length === 0 && (
          <div className="flex h-screen items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-sm"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                <Brain className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No videos yet</h2>
              <p className="text-sm text-white/50">
                Upload a video — it will appear here once Mux finishes processing.
              </p>
            </motion.div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {quizVideo && (
          <QuizModal video={quizVideo} onClose={() => setQuizVideo(null)} onNavigate={onNavigate} />
        )}
      </AnimatePresence>
    </>
  )
}

function VideoCard({ video, isActive, onVideoEnded, onStartQuiz, onRemove, onRefresh }) {
  const playerRef = useRef(null)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(video.likes_count || 0)
  const [playerLoading, setPlayerLoading] = useState(true)
  const [soundOn, setSoundOn] = useState(true)
  const [playbackError, setPlaybackError] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const isOwner = currentUserId && video.user_id === currentUserId

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null)
    })
  }, [])

  const deleteFromDatabase = async () => {
    const { data, error } = await supabase
      .from('videos')
      .delete()
      .select()
      .eq('id', video.id)

    if (error) {
      console.error('Delete failed:', error)
      return { ok: false, message: error.message || 'Delete failed' }
    }

    return { ok: true, data }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this video permanently?')) return

    setDeleting(true)
    const result = await deleteFromDatabase()
    setDeleting(false)

    if (result.ok) {
      onRemove(video.id)
      onRefresh?.()
    } else {
      alert(`Could not delete video: ${result.message}`)
    }
  }

  const handlePlaybackError = async () => {
    setPlaybackError(true)
    setPlayerLoading(false)
    onRemove(video.id)

    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id === video.user_id) {
      await deleteFromDatabase()
    }
  }

  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    if (!isActive) {
      player.pause?.()
      player.muted = true
      return
    }

    if (soundOn) {
      player.muted = false
      player.play?.().catch(() => {})
    }
  }, [isActive, soundOn])

  const toggleSound = () => {
    const player = playerRef.current
    if (!player) return

    const next = !soundOn
    setSoundOn(next)
    player.muted = !next
  }

  const toggleLike = () => {
    setLiked((prev) => !prev)
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1))
  }

  return (
    <div className="h-screen snap-start relative bg-black">
      {playbackError ? null : (
        <>
          <MuxPlayer
            ref={playerRef}
            playbackId={video.mux_playback_id}
            autoplay="muted"
            playsInline
            preload="auto"
            style={{ height: '100%', width: '100%', '--controls': 'none', '--media-object-fit': 'cover' }}
            className="h-full w-full"
            onEnded={onVideoEnded}
            onError={handlePlaybackError}
            onCanPlay={() => setPlayerLoading(false)}
          />

          {playerLoading && isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-8 w-8 rounded-full border-2 border-emerald-400/30 border-t-emerald-400"
              />
            </div>
          )}
        </>
      )}

      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />

      <div className="absolute bottom-24 left-4 right-16 pointer-events-none">
        <p className="text-white text-lg font-semibold drop-shadow-lg">{video.title}</p>
        {video.description && (
          <p className="text-white/60 text-sm mt-1 line-clamp-2">{video.description}</p>
        )}
      </div>

      <div className="absolute right-4 bottom-32 flex flex-col gap-6 z-20">
        <button
          type="button"
          onClick={toggleSound}
          className="flex flex-col items-center"
          aria-label={soundOn ? 'Mute' : 'Unmute'}
        >
          {soundOn ? (
            <Volume2 className="w-8 h-8 text-white" />
          ) : (
            <VolumeX className="w-8 h-8 text-white/50" />
          )}
        </button>

        <button
          type="button"
          onClick={onStartQuiz}
          className="flex flex-col items-center text-emerald-400 hover:text-emerald-300 transition-colors"
          aria-label="Take quiz"
        >
          <Brain className="w-8 h-8" />
          <span className="text-xs mt-1">Quiz</span>
        </button>

        <button
          type="button"
          onClick={toggleLike}
          className="flex flex-col items-center"
        >
          <Heart
            className={`w-8 h-8 transition-all ${
              liked ? 'text-emerald-400 fill-emerald-400 scale-110' : 'text-white'
            }`}
          />
          <span className={`text-sm mt-1 ${liked ? 'text-emerald-400' : 'text-white'}`}>
            {likesCount}
          </span>
        </button>

        {isOwner && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex flex-col items-center text-red-400 hover:text-red-300 transition-colors"
            aria-label="Delete"
          >
            {deleting ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <Trash2 className="w-7 h-7" />
            )}
            <span className="text-xs mt-1">Delete</span>
          </button>
        )}
      </div>
    </div>
  )
}
