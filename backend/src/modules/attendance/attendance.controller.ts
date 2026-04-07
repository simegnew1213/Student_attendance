import type { Request, Response } from 'express'
import type { AttendanceService } from './attendance.service.js'

export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  private firstQueryValue(value: unknown) {
    if (Array.isArray(value)) return value[0]
    return value
  }

  scan = async (req: Request, res: Response) => {
    const attendance = await this.service.scan(req.body)
    res.status(201).json({ data: attendance })
  }

  list = async (req: Request, res: Response) => {
    const query = (req as any).validatedQuery || {}
    const page = Number(this.firstQueryValue(query.page) ?? 1)
    const pageSize = Number(this.firstQueryValue(query.pageSize) ?? 20)

    const result = await this.service.list({
      date: this.firstQueryValue(query.date) as string | undefined,
      studentId: this.firstQueryValue(query.studentId) as string | undefined,
      department: this.firstQueryValue(query.department) as string | undefined,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: Number.isFinite(pageSize) && pageSize > 0 ? Math.min(pageSize, 100) : 20,
    })

    res.json({
      data: result.items,
      meta: {
        total: result.total,
        page,
        pageSize,
      },
    })
  }
}
