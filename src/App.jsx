import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Navigation from './components/Navigation.jsx'
import Upload from './components/Upload.jsx'
import VideoFeed from './components/VideoFeed.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-white">
        <Routes>
          <Route path="/" element={<VideoFeed />} />
          <Route path="/upload" element={<Upload />} />
        </Routes>
        <Navigation />
      </div>
    </BrowserRouter>
  )
}
