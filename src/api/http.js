import axios from 'axios'

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

export const http = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})
