import { Router } from 'express'
import { scheduleController } from '~/controllers/schedule.controller.js'
import { validate } from '~/middleware/validate.js'
import { CreateScheduleSchema, UpdateScheduleSchema, ReorderScheduleSchema, BulkAssignTasksSchema } from '~/model/dto/gantt.dto.js'
import AsyncHandler from '~/utils/async-handler.js'

const router = Router({ mergeParams: true })

// /project/:projectId/schedules
router.get('/', AsyncHandler(scheduleController.getAll))
router.get('/:id', AsyncHandler(scheduleController.getOne))
router.post('/', validate(CreateScheduleSchema), AsyncHandler(scheduleController.create))
router.patch('/reorder', validate(ReorderScheduleSchema), AsyncHandler(scheduleController.reorder))
router.patch('/:id', validate(UpdateScheduleSchema), AsyncHandler(scheduleController.update))
router.delete('/:id', AsyncHandler(scheduleController.delete))
router.post('/:id/tasks/bulk-assign', validate(BulkAssignTasksSchema), AsyncHandler(scheduleController.bulkAssignTasks))
router.patch('/:id/tasks/reorder', AsyncHandler(scheduleController.reorderTasks))

export { router as scheduleRouter }
