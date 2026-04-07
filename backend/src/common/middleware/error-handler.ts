import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../errors/app-error.js'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Log the full error for debugging
  console.error('Error details:', err)
  
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
    })
  }

  // Prisma unique constraint error
  const anyErr = err as any
  if (anyErr?.code === 'P2002') {
    return res.status(409).json({ message: 'Duplicate record', code: 'CONFLICT' })
  }

  return res.status(500).json({
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
  })
}
