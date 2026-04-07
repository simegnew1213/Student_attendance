import { z } from 'zod'

export const createStudentSchema = z.object({
  fullName: z.string().min(1).max(200),
  studentId: z.string().min(1).max(50),
  department: z.string().min(1).max(100),
  gender: z.string().min(1).max(20),
  phoneNumber: z.string().min(7).max(20),
})

export const getStudentByIdSchema = z.object({
  id: z.string().min(1),
})
