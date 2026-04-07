import type { Request, Response } from 'express'
import type { StudentService } from './student.service.js'

export class StudentController {
  constructor(private readonly service: StudentService) {}

  private firstQueryValue(value: unknown) {
    if (Array.isArray(value)) return value[0]
    return value
  }

  private firstParamValue(value: unknown) {
    if (Array.isArray(value)) return value[0]
    return value
  }

  register = async (req: Request, res: Response) => {
    const student = await this.service.register(req.body)
    res.status(201).json({ data: student })
  }

  list = async (req: Request, res: Response) => {
    const page = Number(this.firstQueryValue(req.query.page) ?? 1)
    const pageSize = Number(this.firstQueryValue(req.query.pageSize) ?? 20)

    const result = await this.service.list({
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

  getById = async (req: Request, res: Response) => {
    const id = this.firstParamValue((req.params as any).id)
    const student = await this.service.getById(String(id))
    res.json({ data: student })
  }
}
