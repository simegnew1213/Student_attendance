import { ConflictError, NotFoundError } from '../../common/errors/app-error.js'
import { startOfDayUtc } from '../../common/utils/date.js'
import type { StudentRepository } from '../student/student.repository.js'
import type { AttendanceRepository } from './attendance.repository.js'

export class AttendanceService {
  constructor(
    private readonly attendanceRepo: AttendanceRepository,
    private readonly studentRepo: StudentRepository,
  ) {}

  async scan(input: { studentId: string }) {
    const studentId = input.studentId.trim()

    const student = await this.studentRepo.findByStudentId(studentId)
    if (!student) throw new NotFoundError('Student not found')

    const today = startOfDayUtc(new Date())

    const existing = await this.attendanceRepo.findByStudentAndDate(studentId, today)
    if (existing) throw new ConflictError('Attendance already recorded for today')

    return this.attendanceRepo.create({
      studentId,
      date: today,
      status: 'Present',
    })
  }

  async list(params: {
    date?: string
    studentId?: string
    department?: string
    page: number
    pageSize: number
  }) {
    let date: Date | undefined
    if (params.date) {
      const parsed = new Date(params.date)
      if (!Number.isNaN(parsed.getTime())) {
        date = startOfDayUtc(parsed)
      }
    }

    return this.attendanceRepo.findMany({
      date,
      studentId: params.studentId?.trim() || undefined,
      department: params.department?.trim() || undefined,
      page: params.page,
      pageSize: params.pageSize,
    })
  }

  async getAbsentStudents(date?: string, department?: string) {
    let targetDate: Date
    if (date) {
      const parsed = new Date(date)
      if (Number.isNaN(parsed.getTime())) {
        throw new Error('Invalid date format')
      }
      targetDate = startOfDayUtc(parsed)
    } else {
      targetDate = startOfDayUtc(new Date())
    }

    return this.attendanceRepo.findAbsentStudents(targetDate, department)
  }
}
