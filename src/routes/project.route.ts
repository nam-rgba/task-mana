import { Router } from 'express'
import projectController from '~/controllers/project.controller.js'
import { upload } from '~/config/multer.config.js'
import AsyncHandler from '~/utils/async-handler.js'

const router = Router()

router.get('/', AsyncHandler(projectController.getAll))
router.get('/:id', AsyncHandler(projectController.getOne))
router.post('/', AsyncHandler(projectController.create))
router.patch('/:id', AsyncHandler(projectController.update))
router.delete('/:id', AsyncHandler(projectController.deleteProject))
router.post(
	'/:projectId/gen-schedule',
	upload.single('file'),
	AsyncHandler(projectController.genProjectSchedule)
)
export { router as projectRouter }
