// src/routes/task.routes.ts
import { Router } from 'express'
import ctrl from '~/controllers/task.controller.js'
import AsyncHandler from '~/utils/async-handler.js'

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

export { router as taskRouter }
