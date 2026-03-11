import { Router } from 'express'
import AsyncHandler from '~/utils/async-handler.js'
import { notificationController } from '~/controllers/notification.controller.js'

const router = Router()

router.get('/', AsyncHandler(notificationController.getNotifications))
router.patch('/:id/read', AsyncHandler(notificationController.markAsRead))

export { router as notificationRouter }
