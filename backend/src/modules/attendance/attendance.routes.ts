import { Router } from 'express'
import { prisma } from '../../config/prisma.js'
import { validateBody, validateQuery } from '../../common/middleware/validate.js'
import { StudentRepository } from '../student/student.repository.js'
import { AttendanceController } from './attendance.controller.js'
import { AttendanceRepository } from './attendance.repository.js'
import { AttendanceService } from './attendance.service.js'
import { attendanceQuerySchema, scanAttendanceSchema } from './attendance.validator.js'

const attendanceRepo = new AttendanceRepository(prisma)
const studentRepo = new StudentRepository(prisma)
const service = new AttendanceService(attendanceRepo, studentRepo)
const controller = new AttendanceController(service)

export const attendanceRouter = Router()

attendanceRouter.post('/scan', validateBody(scanAttendanceSchema), controller.scan)
attendanceRouter.get('/', validateQuery(attendanceQuerySchema), controller.list)
