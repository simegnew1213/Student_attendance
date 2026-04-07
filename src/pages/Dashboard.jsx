import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { http } from '../api/http'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    presentToday: 0,
    absentToday: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch students count
        const studentsResponse = await http.get('/students')
        const totalStudents = studentsResponse.data.meta?.total || 0

        // Fetch today's attendance
        const today = new Date().toISOString().split('T')[0]
        const attendanceResponse = await http.get(`/attendance?date=${today}`)
        const attendanceData = attendanceResponse.data.data || []
        const presentToday = attendanceData.filter(a => a.status === 'Present').length

        setStats({
          totalStudents,
          todayAttendance: attendanceData.length,
          presentToday,
          absentToday: totalStudents - presentToday,
        })

        // Simulate recent activity (in a real app, this would come from the backend)
        setRecentActivity([
          { id: 1, type: 'student', message: 'New student registered', time: '2 min ago', icon: '👨‍🎓' },
          { id: 2, type: 'attendance', message: 'Attendance scanned', time: '5 min ago', icon: '✅' },
          { id: 3, type: 'student', message: 'New student registered', time: '10 min ago', icon: '👩‍🎓' },
        ])
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const StatCard = ({ title, value, icon, color, trend, loading }) => (
    <div className={`glass rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 animate-pulse-hover ${loading ? 'shimmer' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{loading ? '...' : value}</p>
          {trend && (
            <div className="flex items-center mt-2 text-sm">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${trend.color}`}>
                {trend.icon} {trend.value}
              </span>
            </div>
          )}
        </div>
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-lg ${color.replace('text', 'bg').replace('-600', '-100')}`}>
          {icon}
        </div>
      </div>
    </div>
  )

  const ActivityItem = ({ activity }) => (
    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
        {activity.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{activity.message}</p>
        <p className="text-xs text-gray-500">{activity.time}</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="glass rounded-2xl p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Welcome Back!</h1>
            <p className="text-gray-600">Here's what's happening with your attendance system today.</p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon="👥"
          color="text-indigo-600"
          trend={{ value: '+12%', icon: '📈', color: 'bg-green-100 text-green-800' }}
          loading={loading}
        />
        <StatCard
          title="Today's Attendance"
          value={stats.todayAttendance}
          icon="📊"
          color="text-purple-600"
          trend={{ value: '+8%', icon: '📈', color: 'bg-green-100 text-green-800' }}
          loading={loading}
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          icon="✅"
          color="text-green-600"
          trend={{ value: '95%', icon: '🎯', color: 'bg-blue-100 text-blue-800' }}
          loading={loading}
        />
        <StatCard
          title="Absent Today"
          value={stats.absentToday}
          icon="❌"
          color="text-red-600"
          trend={{ value: '5%', icon: '📉', color: 'bg-orange-100 text-orange-800' }}
          loading={loading}
        />
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Activity
          </h2>
          <div className="space-y-2">
            {recentActivity.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              to="/students/new"
              className="block w-full text-center px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Register New Student
            </Link>
            <Link
              to="/attendance/scan"
              className="block w-full text-center px-4 py-3 bg-white border-2 border-indigo-500 text-indigo-600 rounded-xl font-medium hover:bg-indigo-50 transform hover:scale-105 transition-all duration-300"
            >
              Scan Attendance
            </Link>
            <Link
              to="/attendance"
              className="block w-full text-center px-4 py-3 bg-white border-2 border-purple-500 text-purple-600 rounded-xl font-medium hover:bg-purple-50 transform hover:scale-105 transition-all duration-300"
            >
              View Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Attendance Chart Placeholder */}
      <div className="glass rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Attendance Overview</h2>
        <div className="h-64 flex items-center justify-center bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">Attendance Chart</p>
            <p className="text-sm text-gray-500 mt-1">Interactive charts coming soon</p>
          </div>
        </div>
      </div>
    </div>
  )
}
