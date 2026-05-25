import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TopBar from './components/TopBar'
import Navigation from './components/Navigation'
import VideoFeed from './components/VideoFeed'
import Upload from './components/Upload'
import Auth from './components/Auth'
import Explore from './components/Explore'
import Stats from './components/Stats'
import ErrorBoundary from './components/ErrorBoundary'
function App() {
  const [currentView, setCurrentView] = useState('feed')

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-white text-gray-900">
      <TopBar currentView={currentView} onNavigate={setCurrentView} />

      <main className="pt-[52px]">
        <AnimatePresence mode="wait">
          {currentView === 'feed' && (
            <motion.div
              key="feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <VideoFeed onNavigate={setCurrentView} />
            </motion.div>
          )}
          {currentView === 'explore' && (
            <motion.div
              key="explore"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Explore />
            </motion.div>
          )}
          {currentView === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Upload onNavigate={setCurrentView} />
            </motion.div>
          )}
          {currentView === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Stats />
            </motion.div>
          )}
          {currentView === 'auth' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Auth onNavigate={setCurrentView} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Navigation currentView={currentView} onNavigate={setCurrentView} />
    </div>
    </ErrorBoundary>
  )
}

export default App
