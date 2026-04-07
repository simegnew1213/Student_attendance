import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import AttendanceHistory from './pages/AttendanceHistory'
import AttendanceScanner from './pages/AttendanceScanner'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'
import StudentRegistration from './pages/StudentRegistration'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students/new" element={<StudentRegistration />} />
          <Route path="/attendance/scan" element={<AttendanceScanner />} />
          <Route path="/attendance" element={<AttendanceHistory />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
