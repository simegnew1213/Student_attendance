import { useEffect, useState } from 'react'
import { http } from '../api/http'

export default function AttendanceHistory() {
  const [attendance, setAttendance] = useState([])
  const [absentStudents, setAbsentStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAbsent, setShowAbsent] = useState(false)
  const [presentCount, setPresentCount] = useState(0)
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    department: '',
    studentId: '',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  })

  const departments = [
    'Computer Science',
    'Information Technology',
    'Software Engineering',
    'Data Science',
    'Cybersecurity',
    'Business Administration',
    'Economics',
    'Psychology',
  ]

  useEffect(() => {
    fetchAttendance()
    if (showAbsent) {
      fetchAbsentStudents()
    }
  }, [filters, pagination.page, showAbsent])

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.date) params.append('date', filters.date)
      if (filters.department) params.append('department', filters.department)
      if (filters.studentId) params.append('studentId', filters.studentId)
      params.append('page', pagination.page.toString())
      params.append('pageSize', pagination.pageSize.toString())

      const response = await http.get(`/attendance?${params}`)
      setAttendance(response.data.data || [])
      setPresentCount(response.data.data?.length || 0)
      setPagination(prev => ({
        ...prev,
        total: response.data.meta?.total || 0,
      }))
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAbsentStudents = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.date) params.append('date', filters.date)
      if (filters.department) params.append('department', filters.department)

      const response = await http.get(`/attendance/absent?${params}`)
      setAbsentStudents(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch absent students:', error)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const setPresetDate = (days) => {
    const date = new Date()
    date.setDate(date.getDate() - days)
    const dateStr = date.toISOString().split('T')[0]
    setFilters(prev => ({ ...prev, date: dateStr }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const getStatusBadge = (status) => {
    const styles = {
      Present: 'bg-green-100 text-green-800 border-green-200',
      Absent: 'bg-red-100 text-red-800 border-red-200',
      Late: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    }
    
    const icons = {
      Present: '✅',
      Absent: '❌',
      Late: '⏰',
    }

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.Present}`}>
        <span className="mr-1">{icons[status] || icons.Present}</span>
        {status}
      </span>
    )
  }

  const exportToCSV = () => {
    const csvContent = [
      ['Student Name', 'Student ID', 'Department', 'Date', 'Status', 'Time'],
      ...attendance.map(record => [
        record.student?.fullName || 'Unknown',
        record.studentId,
        record.student?.department || 'Unknown',
        new Date(record.date).toLocaleDateString(),
        record.status,
        new Date(record.createdAt).toLocaleTimeString(),
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_${filters.date || 'all'}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Attendance History</h1>
              <p className="text-gray-600">View and filter attendance records</p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </h2>

        {/* Preset Date Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setPresetDate(0)}
            className="px-3 py-1 text-sm rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setPresetDate(1)}
            className="px-3 py-1 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Yesterday
          </button>
          <button
            onClick={() => setPresetDate(7)}
            className="px-3 py-1 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setPresetDate(30)}
            className="px-3 py-1 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Last 30 Days
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
            <input
              type="text"
              name="studentId"
              value={filters.studentId}
              onChange={handleFilterChange}
              placeholder="Enter student ID"
              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchAttendance}
              className="w-full px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="glass rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div>
              <p className="text-sm text-gray-600">Present on {filters.date}</p>
              <p className="text-2xl font-bold text-green-600">{presentCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Absent on {filters.date}</p>
              <p className="text-2xl font-bold text-red-600">{absentStudents.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{presentCount + absentStudents.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize) || 1}</p>
            </div>
            <button
              onClick={() => setShowAbsent(!showAbsent)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                showAbsent
                  ? 'bg-red-100 text-red-700 border-2 border-red-300'
                  : 'bg-green-100 text-green-700 border-2 border-green-300'
              }`}
            >
              {showAbsent ? 'Show Present' : 'Show Absent'}
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.pageSize >= pagination.total}
              className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="glass rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Student ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                  </tr>
                ))
              ) : attendance.length > 0 ? (
                attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                          {record.student?.fullName?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {record.student?.fullName || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-mono">{record.studentId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{record.student?.department || 'Unknown'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {new Date(record.createdAt).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-lg font-medium">No attendance records found</p>
                      <p className="text-sm mt-1">Try adjusting your filters or check back later</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Absent Students Section */}
      {showAbsent && (
        <div className="glass rounded-2xl shadow-xl overflow-hidden border-2 border-red-200">
          <div className="bg-gradient-to-r from-red-500 to-orange-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Absent Students ({absentStudents.length})
            </h2>
            <p className="text-red-100 text-sm mt-1">Students who haven't been marked present for the selected date</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Student ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {absentStudents.length > 0 ? (
                  absentStudents.map((student) => (
                    <tr key={student.studentId} className="hover:bg-red-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                            {student.fullName?.charAt(0) || '?'}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {student.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 font-mono">{student.studentId}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{student.department}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge('Absent')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-lg font-medium">All students are present!</p>
                        <p className="text-sm mt-1">Great job tracking attendance today.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
