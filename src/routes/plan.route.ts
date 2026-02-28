import { Router } from 'express'
import planController from '~/controllers/plan.controller.js'
import AsyncHandler from '~/utils/async-handler.js'

const router = Router()

router.get('/', AsyncHandler(planController.getAll))
router.get('/:id', AsyncHandler(planController.getById))

export { router as planRouter }
