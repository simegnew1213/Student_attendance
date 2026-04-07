import { z } from 'zod'

export const scanAttendanceSchema = z.object({
  studentId: z.string().min(1).max(50),
})

export const attendanceQuerySchema = z.object({
  date: z.string().optional(),
  studentId: z.string().optional(),
  department: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
})
