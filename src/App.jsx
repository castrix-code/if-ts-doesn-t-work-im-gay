import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TopBar from './components/TopBar'
import Navigation from './components/Navigation'
import VideoFeed from './components/VideoFeed'
import Upload from './components/Upload'
import Auth from './components/Auth'
import Explore from './components/Explore'
import Stats from './components/Stats'

function App() {
  const [currentView, setCurrentView] = useState('feed')

  return (
    <div className="min-h-screen bg-black text-white">
      <TopBar currentView={currentView} onNavigate={setCurrentView} />

      <main className="pt-[52px]">
        <AnimatePresence mode="wait">
          {currentView === 'feed' && (
            <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <VideoFeed />
            </motion.div>
          )}
          {currentView === 'explore' && (
            <motion.div key="explore" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <Explore />
            </motion.div>
          )}
          {currentView === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <Upload />
            </motion.div>
          )}
          {currentView === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <Stats />
            </motion.div>
          )}
          {currentView === 'auth' && (
            <motion.div key="auth" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <Auth />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Navigation currentView={currentView} onNavigate={setCurrentView} />
    </div>
  )
}

export default App
