import { Router } from 'express'
import { ganttController } from '~/controllers/gantt.controller.js'
import { validate } from '~/middleware/validate.js'
import { GanttScheduleUpdateSchema, CreateDependencySchema } from '~/model/dto/gantt.dto.js'
import { upload } from '~/config/multer.config.js'
import AsyncHandler from '~/utils/async-handler.js'

// /project/:projectId/gantt
const ganttRouter = Router({ mergeParams: true })

ganttRouter.get('/', AsyncHandler(ganttController.getGanttData))
ganttRouter.patch('/schedule', validate(GanttScheduleUpdateSchema), AsyncHandler(ganttController.updateSchedule))

// SSE: upload document → generate schedules + tasks with real-time progress
ganttRouter.post('/generate', upload.single('file'), AsyncHandler(ganttController.generate))

// Dependency sub-routes: /project/:projectId/gantt/task/:taskId/dependencies
ganttRouter.get('/task/:taskId/dependencies', AsyncHandler(ganttController.getDependencies))
ganttRouter.post(
	'/task/:taskId/dependencies',
	validate(CreateDependencySchema),
	AsyncHandler(ganttController.addDependency)
)
ganttRouter.delete('/task/:taskId/dependencies/:depId', AsyncHandler(ganttController.removeDependency))

export { ganttRouter }
