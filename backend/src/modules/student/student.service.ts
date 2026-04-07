import { ConflictError, NotFoundError } from '../../common/errors/app-error.js'
import type { StudentRepository } from './student.repository.js'

export class StudentService {
  constructor(private readonly repo: StudentRepository) {}

  async register(input: {
    fullName: string
    studentId: string
    department: string
    gender: string
    phoneNumber: string
  }) {
    const existing = await this.repo.findByStudentId(input.studentId)
    if (existing) {
      throw new ConflictError('Student ID already exists')
    }

    return this.repo.create({
      fullName: input.fullName.trim(),
      studentId: input.studentId.trim(),
      department: input.department.trim(),
      gender: input.gender.trim(),
      phoneNumber: input.phoneNumber.trim(),
    })
  }

  async list(params: { page: number; pageSize: number }) {
    return this.repo.findMany(params)
  }

  async getById(id: string) {
    const student = await this.repo.findById(id)
    if (!student) throw new NotFoundError('Student not found')
    return student
  }
}
