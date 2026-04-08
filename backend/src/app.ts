import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'

import { env } from './config/env.js'
import { errorHandler } from './common/middleware/error-handler.js'
import { notFound } from './common/middleware/not-found.js'
import { studentRouter } from './modules/student/student.routes.js'
import { attendanceRouter } from './modules/attendance/attendance.routes.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')

  app.use(helmet())
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true)
        
        // Allow any localhost origin in development
        if (origin.startsWith('http://localhost:')) {
          return callback(null, true)
        }
        
        // Check against configured origins
        if (env.corsOrigin.includes(origin)) {
          return callback(null, true)
        }
        
        callback(new Error('Not allowed by CORS'))
      },
      credentials: true,
    }),
  )

  app.use(express.json({ limit: '1mb' }))
  app.use(morgan('dev'))

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  )

  app.get('/api/v1/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/v1/students', studentRouter)
  app.use('/api/v1/attendance', attendanceRouter)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
