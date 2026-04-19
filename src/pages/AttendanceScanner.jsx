import { useState, useEffect, useRef } from 'react'
import jsQR from 'jsqr'
import { QRCodeSVG } from 'qrcode.react'
import { http } from '../api/http'

export default function AttendanceScanner() {
  const [studentId, setStudentId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [scannedStudent, setScannedStudent] = useState(null)
  const [attendanceStatus, setAttendanceStatus] = useState(null)
  const [recentScans, setRecentScans] = useState([])
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [uploadingQR, setUploadingQR] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const detectorRef = useRef(null)
  const lastDetectedRef = useRef({ value: '', ts: 0 })
  const fileInputRef = useRef(null)

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

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
    setAttendanceStatus(null)

    try {
      const response = await http.post('/attendance/scan', { studentId: studentId.trim().toUpperCase() })
      const attendanceData = response.data.data

      setScannedStudent({
        name: attendanceData.student?.fullName || 'Unknown',
        id: attendanceData.studentId,
        department: attendanceData.student?.department || 'Unknown',
        time: new Date().toLocaleTimeString(),
      })

      setAttendanceStatus('Present')
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
        setAttendanceStatus(null)
      }, 5000)

    } catch (error) {
      if (error.response?.status === 409) {
        // Already marked present
        setAttendanceStatus('Already Present')
        setMessage('Student is already marked as present for today.')
        setMessageType('warning')
      } else if (error.response?.data?.message) {
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

  const handleQRUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingQR(true)
    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, canvas.width, canvas.height)

        if (code && code.data) {
          let studentId = ''
          try {
            const data = JSON.parse(code.data)
            if (data && data.studentId) {
              studentId = data.studentId.trim().toUpperCase()
              console.log('Parsed student data from uploaded QR:', data)
            }
          } catch {
            studentId = String(code.data).trim().toUpperCase()
            console.log('Parsed student ID from uploaded QR:', studentId)
          }

          if (studentId) {
            setStudentId(studentId)
            setTimeout(() => {
              const form = document.getElementById('scan-form')
              if (form) form.requestSubmit()
            }, 100)
          } else {
            setMessage('Could not decode student ID from QR code')
            setMessageType('error')
          }
        } else {
          setMessage('No QR code found in the uploaded image')
          setMessageType('error')
        }

        setUploadingQR(false)
        e.target.value = '' // Reset file input
      }

      img.onerror = () => {
        setMessage('Failed to load the uploaded image')
        setMessageType('error')
        setUploadingQR(false)
        e.target.value = ''
      }

      img.src = event.target.result
    }

    reader.onerror = () => {
      setMessage('Failed to read the uploaded file')
      setMessageType('error')
      setUploadingQR(false)
      e.target.value = ''
    }

    reader.readAsDataURL(file)
  }

  const stopCamera = () => {
    setCameraOpen(false)
    setCameraError('')

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause()
      } catch {
      }
      videoRef.current.srcObject = null
    }

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop()
      }
      streamRef.current = null
    }
  }

  const startCamera = async () => {
    setCameraError('')

    if (!('mediaDevices' in navigator) || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera is not supported in this browser.')
      return
    }

    try {
      stopCamera()

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })

      streamRef.current = stream
      setCameraOpen(true)

      if (!detectorRef.current) {
        if ('BarcodeDetector' in window) {
          detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] })
        } else {
          detectorRef.current = null
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      const scanLoop = async () => {
        if (!videoRef.current) return

        if (videoRef.current.readyState >= 2) {
          try {
            let raw = ''

            if (detectorRef.current) {
              const barcodes = await detectorRef.current.detect(videoRef.current)
              raw = barcodes?.[0]?.rawValue || ''
            } else {
              const canvas = canvasRef.current
              const video = videoRef.current
              if (canvas) {
                const w = video.videoWidth || 640
                const h = video.videoHeight || 360
                canvas.width = w
                canvas.height = h
                const ctx = canvas.getContext('2d', { willReadFrequently: true })
                if (ctx) {
                  ctx.drawImage(video, 0, 0, w, h)
                  const imageData = ctx.getImageData(0, 0, w, h)
                  const code = jsQR(imageData.data, w, h)
                  raw = code?.data || ''
                }
              }
            }

            if (raw) {
              const now = Date.now()
              const last = lastDetectedRef.current
              if (raw !== last.value || now - last.ts > 1500) {
                lastDetectedRef.current = { value: raw, ts: now }
                
                let studentId = ''
                try {
                  // Try to parse as JSON (new format with full student data)
                  const data = JSON.parse(raw)
                  if (data && data.studentId) {
                    studentId = data.studentId.trim().toUpperCase()
                    console.log('Parsed student data from QR:', data)
                  }
                } catch {
                  // If not JSON, treat as plain student ID (old format)
                  studentId = String(raw).trim().toUpperCase()
                  console.log('Parsed student ID from QR:', studentId)
                }
                
                if (studentId) {
                  setStudentId(studentId)
                  setTimeout(() => {
                    const form = document.getElementById('scan-form')
                    if (form) form.requestSubmit()
                  }, 50)
                }
              }
            }
          } catch {}
        }

        rafRef.current = requestAnimationFrame(scanLoop)
      }

      rafRef.current = requestAnimationFrame(scanLoop)
    } catch (err) {
      const name = err?.name || ''
      if (name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access and try again.')
      } else if (name === 'NotFoundError') {
        setCameraError('No camera device found.')
      } else {
        setCameraError('Failed to start camera. Please try again.')
      }
      stopCamera()
    }
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

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {!cameraOpen ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-white/80 hover:bg-white border border-white/60 shadow-sm transition-colors"
                >
                  Scan QR with Camera
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-xl bg-white/80 hover:bg-white border border-white/60 shadow-sm transition-colors"
                >
                  Stop Camera
                </button>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingQR}
                className="px-4 py-2 rounded-xl bg-white/80 hover:bg-white border border-white/60 shadow-sm transition-colors disabled:opacity-50"
              >
                {uploadingQR ? (
                  <span className="flex items-center">
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </span>
                ) : (
                  'Upload QR Image'
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleQRUpload}
                className="hidden"
              />

              <div className="text-xs text-gray-500">
                Tip: QR should contain the Student ID (e.g. CS2024001)
              </div>
            </div>

            {cameraError ? (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-fadeIn">
                {cameraError}
              </div>
            ) : null}

            {cameraOpen ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/50 shadow-sm bg-black/5">
                <video
                  ref={videoRef}
                  className="w-full aspect-video object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
            ) : null}
          </div>
        </form>

        {/* Message Display */}
        {message && (
          <div className={`mt-6 p-4 rounded-xl animate-fadeIn ${
            messageType === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : messageType === 'warning'
              ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <div className="flex items-center">
              {messageType === 'success' ? (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : messageType === 'warning' ? (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {message}
            </div>
          </div>
        )}

        {/* Success Card with QR Code */}
        {scannedStudent && (
          <div className={`mt-6 p-6 rounded-xl animate-fadeIn ${
            attendanceStatus === 'Already Present'
              ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200'
              : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
          }`}>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg shrink-0 ${
                  attendanceStatus === 'Already Present'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600'
                }`}>
                  {attendanceStatus === 'Already Present' ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className={`font-bold ${
                    attendanceStatus === 'Already Present'
                      ? 'text-yellow-900'
                      : 'text-green-900'
                  }`}>
                    {attendanceStatus === 'Already Present' ? 'Already Present!' : 'Attendance Recorded!'}
                  </h3>
                  <p className={`font-medium ${
                    attendanceStatus === 'Already Present'
                      ? 'text-yellow-700'
                      : 'text-green-700'
                  }`}>{scannedStudent.name}</p>
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
