import { Router } from 'express'
import { apiKeyController } from '~/controllers/api-key.controller.js'
import AsyncHandler from '~/utils/async-handler.js'

const router = Router()

router.post('/', AsyncHandler(apiKeyController.create))
router.get('/', AsyncHandler(apiKeyController.getList))
router.patch('/:id', AsyncHandler(apiKeyController.update))
router.delete('/:id', AsyncHandler(apiKeyController.delete))
router.get('/:id/usages', AsyncHandler(apiKeyController.getUsageList))
router.get('/:id/usages/overview', AsyncHandler(apiKeyController.getUsageOverview))

export { router as apiKeyRouter }
