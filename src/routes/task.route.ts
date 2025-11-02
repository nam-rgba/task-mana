// src/routes/task.routes.ts
import { Router } from 'express'
import ctrl from '~/controllers/task.controller.js'
import AsyncHandler from '~/utils/async-handler.js'

const router = Router()

router.post('/', AsyncHandler(ctrl.create))
router.get('/', AsyncHandler(ctrl.get))
router.delete('/:id', AsyncHandler(ctrl.dlt))

export { router as taskRouter }
