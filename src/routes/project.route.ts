import { Router } from 'express'
import projectController from '~/controllers/project.controller.js'
import AsyncHandler from '~/utils/async-handler.js'

const router = Router()

router.get('/', AsyncHandler(projectController.getAll))
router.post('/', AsyncHandler(projectController.create))
export { router as projectRouter }
