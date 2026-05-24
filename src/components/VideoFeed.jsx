import { useCallback, useEffect, useRef, useState } from 'react'
import MuxPlayer from '@mux/mux-player-react'
import { Brain, Trash2, Volume2, VolumeX } from 'lucide-react'
import { supabase } from '../lib/supabase'
import QuizModal from './QuizModal'

export default function VideoFeed() {
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
      <div
        className="h-screen overflow-y-scroll snap-y snap-mandatory pb-16"
        onScroll={handleScroll}
      >
        {loading && (
          <div className="h-screen flex items-center justify-center bg-black">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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
            />
          ))}

        {!loading && videos.length === 0 && (
          <div className="h-screen flex flex-col items-center justify-center bg-black px-6 text-center">
            <p className="text-white text-xl font-semibold">No videos yet</p>
            <p className="text-gray-400 mt-2">
              Upload a video — it will appear here once Mux finishes processing.
            </p>
          </div>
        )}
      </div>

      {quizVideo && (
        <QuizModal video={quizVideo} onClose={() => setQuizVideo(null)} />
      )}
    </>
  )
}

function VideoCard({ video, isActive, onVideoEnded, onStartQuiz, onRemove }) {
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
    const { error } = await supabase.from('videos').delete().eq('id', video.id)
    if (error) {
      console.error('Delete failed:', error.message)
      return false
    }
    return true
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this video permanently?')) return

    setDeleting(true)
    const ok = await deleteFromDatabase()
    setDeleting(false)

    if (ok) {
      onRemove(video.id)
    } else {
      alert('Could not delete video. Run the delete policy SQL in SETUP.md or delete the row in Supabase Table Editor.')
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

  // Browsers require muted autoplay; unmute when this card is active
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
    } else {
      player.muted = true
    }
  }, [isActive, soundOn])

  // Backup: ensure "ended" opens quiz (onEnded prop can miss on web component)
  useEffect(() => {
    const player = playerRef.current
    if (!player || !isActive) return

    const handleEnded = () => onVideoEnded()
    player.addEventListener('ended', handleEnded)
    return () => player.removeEventListener('ended', handleEnded)
  }, [isActive, onVideoEnded])

  const toggleSound = () => {
    const player = playerRef.current
    const next = !soundOn
    setSoundOn(next)
    if (player) {
      player.muted = !next
      if (next) player.play?.().catch(() => {})
    }
  }

  const handleLike = async () => {
    if (liked) return

    const newCount = likesCount + 1
    setLiked(true)
    setLikesCount(newCount)

    await supabase
      .from('videos')
      .update({ likes_count: newCount })
      .eq('id', video.id)
  }

  if (playbackError) {
    return null
  }

  return (
    <div className="h-screen snap-start relative bg-black">
      {playerLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <MuxPlayer
        ref={playerRef}
        playbackId={video.mux_playback_id}
        streamType="on-demand"
        autoPlay={isActive ? 'muted' : false}
        muted={!isActive || !soundOn}
        loop={false}
        playsInline
        preload={isActive ? 'auto' : 'metadata'}
        onLoadedData={() => {
          setPlayerLoading(false)
          if (isActive && soundOn && playerRef.current) {
            playerRef.current.muted = false
          }
        }}
        onPause={() => {
          if (!isActive) setPlayerLoading(false)
        }}
        onEnded={onVideoEnded}
        onError={handlePlaybackError}
        style={{
          height: '100%',
          width: '100%',
          '--controls': 'none',
          '--media-object-fit': 'cover',
        }}
        className="h-full w-full"
      />

      <div className="absolute bottom-24 left-4 right-16 pointer-events-none">
        <p className="text-white text-lg font-semibold drop-shadow-lg">
          {video.title || 'Educational Video'}
        </p>
        {video.description && (
          <p className="text-gray-300 text-sm mt-1 drop-shadow-lg line-clamp-2">
            {video.description}
          </p>
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
            <VolumeX className="w-8 h-8 text-white" />
          )}
        </button>

        {isOwner && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex flex-col items-center text-gray-400 hover:text-red-400 disabled:opacity-50"
            aria-label="Delete video"
          >
            <Trash2 className="w-8 h-8" />
            <span className="text-xs mt-1">{deleting ? '...' : 'Delete'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onStartQuiz}
          className="flex flex-col items-center text-indigo-400 hover:text-indigo-300"
          aria-label="Take quiz"
        >
          <Brain className="w-8 h-8" />
          <span className="text-xs mt-1">Quiz</span>
        </button>

        <button
          type="button"
          onClick={handleLike}
          className="flex flex-col items-center"
        >
          <svg
            className="w-8 h-8 text-white"
            fill={liked ? '#ef4444' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span className="text-white text-sm mt-1">{likesCount}</span>
        </button>
      </div>
    </div>
  )
}
