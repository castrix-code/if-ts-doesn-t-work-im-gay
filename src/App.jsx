import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Navigation from './components/Navigation.jsx'
import TopBar from './components/TopBar.jsx'
import Upload from './components/Upload.jsx'
import VideoFeed from './components/VideoFeed.jsx'
import Auth from './components/Auth.jsx'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-white pt-24">
        <TopBar />
        <main className="pb-28">
          <Routes>
            <Route path="/" element={<VideoFeed />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/login" element={<Auth />} />
          </Routes>
        </main>
        <Navigation />
      </div>
    </BrowserRouter>
  )
}

export default App
