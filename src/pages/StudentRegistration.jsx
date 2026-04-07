import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { http } from '../api/http'

// FormField component moved outside to prevent recreation on render
function FormField({ label, name, required = false, error, children }) {
  return (
    <div className="space-y-2">
      <label className={`block text-sm font-medium ${error ? 'text-red-600' : 'text-gray-700'}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600 animate-fadeIn">{error}</p>
      )}
    </div>
  )
}

export default function StudentRegistration() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    department: '',
    gender: '',
    phoneNumber: '',
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

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

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    setErrors(prev => {
      if (prev[name]) {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      }
      return prev
    })
  }, [])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    
    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required'
    } else if (!/^[A-Z0-9]{4,10}$/.test(formData.studentId)) {
      newErrors.studentId = 'Student ID must be 4-10 alphanumeric characters'
    }
    
    if (!formData.department) {
      newErrors.department = 'Department is required'
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Gender is required'
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required'
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number'
    }
    
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formErrors = validateForm()
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await http.post('/students', formData)
      setSubmitSuccess(true)
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (error) {
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message })
      } else {
        setErrors({ submit: 'Failed to register student. Please try again.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass rounded-2xl p-8 shadow-xl text-center max-w-md animate-fadeIn">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg mx-auto mb-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Registered Successfully!</h2>
          <p className="text-gray-600 mb-4">Redirecting to dashboard...</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-8 shadow-xl">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Register New Student</h1>
            <p className="text-gray-600">Add a new student to the attendance system</p>
          </div>
        </div>

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-fadeIn">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.submit}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Full Name" name="fullName" required error={errors.fullName}>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                autoComplete="name"
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.fullName 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                placeholder="Enter student's full name"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField label="Student ID" name="studentId" required error={errors.studentId}>
              <input
                type="text"
                id="studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                autoComplete="off"
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase ${
                  errors.studentId 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                placeholder="e.g., CS2024001"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField label="Department" name="department" required error={errors.department}>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.department 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Gender" name="gender" required error={errors.gender}>
              <div className="grid grid-cols-2 gap-3">
                {['Male', 'Female'].map(gender => (
                  <label
                    key={gender}
                    className={`relative flex items-center justify-center px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      formData.gender === gender
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      id={`gender-${gender}`}
                      name="gender"
                      value={gender}
                      checked={formData.gender === gender}
                      onChange={handleChange}
                      className="sr-only"
                      disabled={isSubmitting}
                    />
                    <span className="font-medium">{gender}</span>
                  </label>
                ))}
              </div>
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Phone Number" name="phoneNumber" required error={errors.phoneNumber}>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  autoComplete="tel"
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.phoneNumber 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="+251 9xx xxx xxx"
                  disabled={isSubmitting}
                />
              </FormField>
            </div>
          </div>

          <div className="flex space-x-4 pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-6 py-3 rounded-xl font-medium text-white transition-all duration-300 transform hover:scale-105 ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Registering...
                </div>
              ) : (
                'Register Student'
              )}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
