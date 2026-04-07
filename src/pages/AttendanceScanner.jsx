import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { http } from '../api/http'

export default function AttendanceScanner() {
  const [studentId, setStudentId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [scannedStudent, setScannedStudent] = useState(null)
  const [recentScans, setRecentScans] = useState([])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!studentId.trim()) {
      setMessage('Please enter a student ID')
      setMessageType('error')
      return
    }
    
    setIsSubmitting(true)
    setMessage('')
    setScannedStudent(null)
    
    try {
      const response = await http.post('/attendance/scan', { studentId: studentId.trim().toUpperCase() })
      const attendanceData = response.data.data
      
      setScannedStudent({
        name: attendanceData.student?.fullName || 'Unknown',
        id: attendanceData.studentId,
        department: attendanceData.student?.department || 'Unknown',
        time: new Date().toLocaleTimeString(),
      })
      
      setMessage('Attendance recorded successfully!')
      setMessageType('success')
      
      // Add to recent scans
      setRecentScans(prev => [
        {
          id: Date.now(),
          studentId: attendanceData.studentId,
          name: attendanceData.student?.fullName || 'Unknown',
          time: new Date().toLocaleTimeString(),
          status: 'Present'
        },
        ...prev.slice(0, 4) // Keep only last 5 scans
      ])
      
      setStudentId('')
      
      // Clear success message after 5 seconds to give time to see QR
      setTimeout(() => {
        setMessage('')
        setScannedStudent(null)
      }, 5000)
      
    } catch (error) {
      if (error.response?.data?.message) {
        setMessage(error.response.data.message)
      } else {
        setMessage('Failed to record attendance. Please try again.')
      }
      setMessageType('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickScan = (id) => {
    setStudentId(id)
    setTimeout(() => {
      const form = document.getElementById('scan-form')
      if (form) form.requestSubmit()
    }, 100)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-8 shadow-xl">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Attendance Scanner</h1>
            <p className="text-gray-600">Scan student ID to record attendance</p>
          </div>
        </div>

        {/* Scanner Form */}
        <form id="scan-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                  className="w-full pl-12 pr-4 py-4 text-xl font-mono rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                  placeholder="Enter or scan Student ID"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-4 rounded-xl font-medium text-white transition-all duration-300 transform hover:scale-105 ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:shadow-lg'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Scanning...
                  </div>
                ) : (
                  'Scan Attendance'
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Message Display */}
        {message && (
          <div className={`mt-6 p-4 rounded-xl animate-fadeIn ${
            messageType === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <div className="flex items-center">
              {messageType === 'success' ? (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {message}
            </div>
          </div>
        )}

        {/* Success Card with QR Code */}
        {scannedStudent && (
          <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl animate-fadeIn">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-green-900">Attendance Recorded!</h3>
                  <p className="text-green-700 font-medium">{scannedStudent.name}</p>
                  <p className="text-sm text-green-600">{scannedStudent.department}</p>
                  <p className="text-xs text-green-500 font-mono mt-1">ID: {scannedStudent.id} | {scannedStudent.time}</p>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-xl shadow-md border border-green-100 flex flex-col items-center gap-2">
                <QRCodeSVG 
                  value={scannedStudent.id} 
                  size={120}
                  level="H"
                  includeMargin={true}
                  className="rounded-lg"
                />
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Digital Receipt</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Access */}
        <div className="glass rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Access
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {['CS2024001', 'IT2024002', 'SE2024003', 'DS2024004'].map(id => (
              <button
                key={id}
                onClick={() => handleQuickScan(id)}
                className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-all duration-300 transform hover:scale-105"
              >
                <span className="font-mono text-sm font-medium text-purple-700">{id}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">Click to quickly scan common student IDs</p>
        </div>

        {/* Recent Scans */}
        <div className="glass rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Scans
          </h2>
          <div className="space-y-3">
            {recentScans.length > 0 ? (
              recentScans.map(scan => (
                <div key={scan.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg hover:shadow-sm transition-all">
                  <div>
                    <p className="font-medium text-gray-900">{scan.name}</p>
                    <p className="text-sm text-gray-600 font-mono">{scan.studentId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{scan.time}</p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {scan.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No recent scans</p>
                <p className="text-sm">Start scanning to see activity here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="glass rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">How to Use</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white shadow-lg mx-auto mb-3">
              <span className="text-2xl font-bold">1</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Enter Student ID</h3>
            <p className="text-sm text-gray-600">Type or scan the student's unique ID</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white shadow-lg mx-auto mb-3">
              <span className="text-2xl font-bold">2</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Click Scan</h3>
            <p className="text-sm text-gray-600">Press the scan button to record attendance</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white shadow-lg mx-auto mb-3">
              <span className="text-2xl font-bold">3</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Confirmation</h3>
            <p className="text-sm text-gray-600">See success confirmation and QR receipt</p>
          </div>
        </div>
      </div>
    </div>
  )
}
