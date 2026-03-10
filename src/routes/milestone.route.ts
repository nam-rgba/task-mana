import { Router } from 'express'
import { milestoneController } from '~/controllers/milestone.controller.js'
import { validate } from '~/middleware/validate.js'
import { CreateMilestoneSchema, UpdateMilestoneSchema } from '~/model/dto/gantt.dto.js'
import AsyncHandler from '~/utils/async-handler.js'

// /project/:projectId/milestones
const milestoneRouter = Router({ mergeParams: true })

milestoneRouter.get('/', AsyncHandler(milestoneController.getAll))
milestoneRouter.post('/', validate(CreateMilestoneSchema), AsyncHandler(milestoneController.create))
milestoneRouter.patch('/:id', validate(UpdateMilestoneSchema), AsyncHandler(milestoneController.update))
milestoneRouter.delete('/:id', AsyncHandler(milestoneController.delete))

export { milestoneRouter }
