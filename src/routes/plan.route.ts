import { Router } from 'express'
import planController from '~/controllers/plan.controller.js'
import AsyncHandler from '~/utils/async-handler.js'
import { validate } from '~/middleware/validate.js'
import { CreatePlanSchema } from '~/model/dto/plan.dto.js'

const router = Router()

router.get('/', AsyncHandler(planController.getAll))
router.get('/:id', AsyncHandler(planController.getById))
router.post('/', validate(CreatePlanSchema), AsyncHandler(planController.create))

export { router as planRouter }
