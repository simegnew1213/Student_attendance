import type { NextFunction, Request, Response } from 'express'
import type { ZodSchema } from 'zod'
import { BadRequestError } from '../errors/app-error.js'

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return next(new BadRequestError(result.error.issues[0]?.message ?? 'Invalid request'))
    }
    req.body = result.data
    next()
  }
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      return next(new BadRequestError(result.error.issues[0]?.message ?? 'Invalid query'))
    }
    // Store validated query data in a different property to avoid read-only error
    ;(req as any).validatedQuery = result.data
    next()
  }
}
