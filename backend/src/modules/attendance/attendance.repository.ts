import type { Attendance, PrismaClient } from '@prisma/client'

export class AttendanceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: { studentId: string; date: Date; status: string }): Promise<Attendance> {
    return this.prisma.attendance.create({ data })
  }

  async findMany(params: {
    date?: Date
    studentId?: string
    department?: string
    page: number
    pageSize: number
  }) {
    const { date, studentId, department, page, pageSize } = params

    let studentIds: string[] | undefined
    if (department) {
      // First get students in the department
      const students = await this.prisma.student.findMany({
        where: { department },
        select: { studentId: true },
      })
      studentIds = students.map((s) => s.studentId)
      // If no students in department, return empty result
      if (studentIds.length === 0) {
        return { items: [], total: 0 }
      }
    }

    const where: any = {}
    if (date) where.date = date
    if (studentId) where.studentId = studentId
    if (studentIds) where.studentId = { in: studentIds }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          student: true,
        },
      }),
      this.prisma.attendance.count({ where }),
    ])

    return { items, total }
  }

  async findByStudentAndDate(studentId: string, date: Date) {
    return this.prisma.attendance.findUnique({
      where: {
        studentId_date: {
          studentId,
          date,
        },
      },
    })
  }

  async findAbsentStudents(date: Date, department?: string) {
    const where: any = {}
    if (department) where.department = department

    const allStudents = await this.prisma.student.findMany({
      where,
      select: { studentId: true, fullName: true, department: true },
    })

    const presentStudentIds = await this.prisma.attendance
      .findMany({
        where: { date },
        select: { studentId: true },
      })
      .then((records) => records.map((r) => r.studentId))

    const absentStudents = allStudents.filter(
      (student) => !presentStudentIds.includes(student.studentId)
    )

    return absentStudents
  }
}
