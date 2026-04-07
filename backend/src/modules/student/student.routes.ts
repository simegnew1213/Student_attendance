import { Router } from 'express'
import { prisma } from '../../config/prisma.js'
import { validateBody } from '../../common/middleware/validate.js'
import { StudentController } from './student.controller.js'
import { StudentRepository } from './student.repository.js'
import { StudentService } from './student.service.js'
import { createStudentSchema } from './student.validator.js'

const repo = new StudentRepository(prisma)
const service = new StudentService(repo)
const controller = new StudentController(service)

export const studentRouter = Router()

studentRouter.post('/', validateBody(createStudentSchema), controller.register)
studentRouter.get('/', controller.list)
studentRouter.get('/:id', controller.getById)
