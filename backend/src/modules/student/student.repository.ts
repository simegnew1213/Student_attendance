import type { PrismaClient, Student } from '@prisma/client'

export class StudentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    fullName: string
    studentId: string
    department: string
    gender: string
    phoneNumber: string
  }): Promise<Student> {
    return this.prisma.student.create({ data })
  }

  async findMany(params: { page: number; pageSize: number }) {
    const { page, pageSize } = params

    const [items, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.student.count(),
    ])

    return { items, total }
  }

  async findById(id: string) {
    return this.prisma.student.findUnique({ where: { id } })
  }

  async findByStudentId(studentId: string) {
    return this.prisma.student.findUnique({ where: { studentId } })
  }
}
