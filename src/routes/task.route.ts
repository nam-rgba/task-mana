// src/routes/task.routes.ts
import { Router } from 'express'
import ctrl from '~/controllers/task.controller.js'
import { upload } from '~/config/multer.config.js'
import AsyncHandler from '~/utils/async-handler.js'
import { validate } from '~/middleware/validate.js'
import { ReviewPerformanceSchema, TeamPerformanceDashboardSchema } from '~/model/dto/task.dto.js'

const router = Router()

router.post('/', AsyncHandler(ctrl.create))
router.patch('/:id', AsyncHandler(ctrl.update))
router.get('/', AsyncHandler(ctrl.get))
router.delete('/:id', AsyncHandler(ctrl.dlt))
router.post('/ai-gen', AsyncHandler(ctrl.genAiTask))
router.post('/:id/submit-qc', AsyncHandler(ctrl.submitForQC))
router.post('/:id/qc-review', AsyncHandler(ctrl.submitQCReview))
router.get('/suggest-today', AsyncHandler(ctrl.suggestTaskToday))
router.get('/:id', AsyncHandler(ctrl.getOne))
router.post('/suggest-developer', AsyncHandler(ctrl.suggestDev))
router.post('/estimate-sp', AsyncHandler(ctrl.estimateSP))
router.post('/check-duplicate', AsyncHandler(ctrl.checkDuplicateTask))
router.post(
	'/performance-dashboard',
	validate(TeamPerformanceDashboardSchema),
	AsyncHandler(ctrl.teamPerformanceDashboard)
)
router.post('/ai-review-performance', validate(ReviewPerformanceSchema), AsyncHandler(ctrl.reviewPerformance))
router.post('/:id/comments', upload.single('attachment'), AsyncHandler(ctrl.createComment))
router.get('/:id/comments', AsyncHandler(ctrl.getComments))

export { router as taskRouter }
